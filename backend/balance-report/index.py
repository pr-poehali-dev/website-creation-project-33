import json
import os
import psycopg2
from typing import Dict, Any

SCHEMA = 't_p24058207_website_creation_pro'


def get_db_connection():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def calc_kms_query(extra_where: str) -> str:
    return f"""
    SELECT SUM(kms) FROM (
        SELECT
            ae.user_id,
            ae.work_date,
            COALESCE(ae.compensation_amount, 0) AS comp,
            COALESCE(ae.expense_amount, 0) AS expense,
            COALESCE(ae.employee_status_at_shift, u.employee_status, 'employee') AS emp_status,
            (SELECT COUNT(*) FROM {SCHEMA}.leads_analytics la
             WHERE la.user_id = ae.user_id AND la.organization_id = ae.organization_id
               AND la.is_active = true AND la.lead_type = 'контакт'
               AND DATE(la.created_at + interval '3 hours') = ae.work_date) AS contacts,
            COALESCE((SELECT orp.contact_rate FROM {SCHEMA}.organization_rate_periods orp
                 WHERE orp.organization_id = ae.organization_id AND orp.start_date <= ae.work_date
                   AND (orp.end_date IS NULL OR orp.end_date >= ae.work_date)
                 ORDER BY orp.start_date DESC LIMIT 1), o.contact_rate, 0) AS eff_rate,
            COALESCE((SELECT orp.payment_type FROM {SCHEMA}.organization_rate_periods orp
                 WHERE orp.organization_id = ae.organization_id AND orp.start_date <= ae.work_date
                   AND (orp.end_date IS NULL OR orp.end_date >= ae.work_date)
                 ORDER BY orp.start_date DESC LIMIT 1), o.payment_type, 'cash') AS eff_pt
        FROM {SCHEMA}.accounting_expenses ae
        JOIN {SCHEMA}.organizations o ON o.id = ae.organization_id
        JOIN {SCHEMA}.users u ON u.id = ae.user_id
        WHERE {extra_where}
    ) s,
    LATERAL (
        SELECT
            ROUND((
                (s.contacts * s.eff_rate + s.comp)
                - CASE WHEN s.eff_pt = 'cashless' THEN ROUND((s.contacts * s.eff_rate + s.comp) * 0.07) ELSE 0 END
                - CASE WHEN s.emp_status = 'intern' AND s.work_date >= '2026-05-08' THEN s.contacts * 260
                       WHEN s.contacts >= 10 THEN s.contacts * 300
                       ELSE s.contacts * 200 END
                - s.expense
            ) / 2.0) AS kms
    ) k
    """


def calc_salary_query(extra_where: str) -> str:
    return f"""
    SELECT SUM(salary) FROM (
        SELECT
            ae.user_id,
            ae.work_date,
            COALESCE(ae.employee_status_at_shift, u.employee_status, 'employee') AS emp_status,
            (SELECT COUNT(*) FROM {SCHEMA}.leads_analytics la
             WHERE la.user_id = ae.user_id AND la.organization_id = ae.organization_id
               AND la.is_active = true AND la.lead_type = 'контакт'
               AND DATE(la.created_at + interval '3 hours') = ae.work_date) AS contacts
        FROM {SCHEMA}.accounting_expenses ae
        JOIN {SCHEMA}.users u ON u.id = ae.user_id
        WHERE {extra_where}
    ) s,
    LATERAL (
        SELECT
            CASE WHEN s.emp_status = 'intern' AND s.work_date >= '2026-05-08' THEN s.contacts * 260
                 WHEN s.contacts >= 10 THEN s.contacts * 300
                 ELSE s.contacts * 200
            END AS salary
    ) k
    """


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Расчёт баланса: X (КМС долг КВВ) минус Y (КВВ долг + зарплата долг по КМС счетам)"""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
        'Content-Type': 'application/json'
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    conn = get_db_connection()
    cur = conn.cursor()

    cur.execute(calc_kms_query("ae.paid_kms = false AND ae.invoice_party = 'kvv'"))
    x = cur.fetchone()[0] or 0

    cur.execute(calc_kms_query("ae.invoice_party = 'kms' AND ae.paid_kvv = false"))
    y_kms = cur.fetchone()[0] or 0

    cur.execute(calc_salary_query("ae.invoice_party = 'kms' AND ae.paid_to_worker = false"))
    y_salary = cur.fetchone()[0] or 0

    cur.close()
    conn.close()

    y = y_kms + y_salary
    balance = x - y

    return {
        'statusCode': 200,
        'headers': headers,
        'body': json.dumps({
            'x': int(x),
            'y_kms': int(y_kms),
            'y_salary': int(y_salary),
            'y': int(y),
            'balance': int(balance)
        })
    }