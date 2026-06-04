import json
import math
import os
import psycopg2
import requests
from datetime import date, timedelta, datetime, timezone
from typing import Dict, Any
from push_utils import notify_admins

SCHEMA = 't_p24058207_website_creation_pro'
BOT_TOKEN = '8081347931:AAGTto62t8bmIIzdDZu5wYip0QP95JJxvIc'
CHAT_IDS = ['5215501225', '1526249125']


def send_telegram_message(text: str):
    url = f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage'
    for chat_id in CHAT_IDS:
        requests.post(url, json={
            'chat_id': chat_id,
            'text': text,
            'parse_mode': 'HTML'
        }, timeout=15)



def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Ежедневный отчёт в 23:59: заработок за день, контакты, незаполненные слоты на завтра.
    Запускается по cron или вручную через GET-запрос.
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'No DATABASE_URL'})}

    # Поддержка тестового режима: ?test_date=2026-05-05
    params = event.get('queryStringParameters') or {}
    test_date_str = params.get('test_date')
    MSK = timezone(timedelta(hours=3))
    if test_date_str:
        today = date.fromisoformat(test_date_str)
    else:
        today = datetime.now(MSK).date()
    tomorrow = today + timedelta(days=1)

    with psycopg2.connect(database_url) as conn:
        with conn.cursor() as cur:

            # === Push-уведомление ===
            notify_admins(conn, '📊 Итоги дня', f'Вечерний отчёт за {today.strftime("%d.%m.%Y")} готов')

            # === 1. Контакты за сегодня ===
            cur.execute(f"""
                SELECT u.name, COUNT(*) as cnt
                FROM {SCHEMA}.leads_analytics la
                JOIN {SCHEMA}.users u ON u.id = la.user_id
                WHERE la.is_active = true
                  AND la.lead_type = 'контакт'
                  AND DATE(la.created_at + interval '3 hours') = %s
                GROUP BY u.name
                ORDER BY cnt DESC
            """, (today,))
            contacts_rows = cur.fetchall()
            total_contacts = sum(r[1] for r in contacts_rows)

            # === 2. КМС за сегодня (по accounting_expenses — тот же источник что бух учёт) ===
            cur.execute(f"""
                SELECT ae.user_id, o.name as org_name,
                       COALESCE(rp.contact_rate, o.contact_rate, 0) as rate,
                       COALESCE(rp.payment_type, o.payment_type, 'cash') as payment_type,
                       COALESCE(ae.compensation_amount, 0) as compensation,
                       (SELECT COUNT(*) FROM {SCHEMA}.leads_analytics la
                        WHERE la.user_id = ae.user_id
                          AND la.organization_id = ae.organization_id
                          AND la.is_active = true
                          AND la.lead_type = 'контакт'
                          AND DATE(la.created_at + interval '3 hours') = ae.work_date) as contacts_count,
                       COALESCE(ae.employee_status_at_shift, u.employee_status, 'employee') as emp_status,
                       COALESCE(ae.expense_amount, 0) as expense_amount
                FROM {SCHEMA}.accounting_expenses ae
                JOIN {SCHEMA}.users u ON u.id = ae.user_id
                JOIN {SCHEMA}.organizations o ON o.id = ae.organization_id
                LEFT JOIN {SCHEMA}.organization_rate_periods rp
                    ON rp.organization_id = ae.organization_id
                    AND rp.start_date <= ae.work_date
                    AND (rp.end_date IS NULL OR rp.end_date >= ae.work_date)
                WHERE ae.work_date = %s
            """, (today,))
            shifts_today = cur.fetchall()

            intern_rate_start = date(2026, 5, 8)
            intern_rate_end = date(2026, 6, 4)

            total_kms = 0
            for user_id, org_name, rate, payment_type, compensation, contacts, emp_status, expense_amount in shifts_today:
                contacts = contacts or 0
                revenue = contacts * rate + compensation
                tax = round(revenue * 0.07) if payment_type == 'cashless' else 0
                after_tax = revenue - tax
                # Зарплата с учётом статуса (стажёр / сотрудник)
                if emp_status == 'intern' and intern_rate_start <= today < intern_rate_end:
                    worker_salary = contacts * 260
                elif contacts >= 10:
                    worker_salary = contacts * 300
                else:
                    worker_salary = contacts * 200
                net_profit = after_tax - worker_salary - expense_amount
                kms = math.ceil(net_profit / 2)
                total_kms += kms

            # === 3. Незаполненные слоты на завтра ===
            # Ищем planned_organizations на завтра
            cur.execute(f"""
                SELECT po.id, o.name as org_name, po.time_from, po.time_to
                FROM {SCHEMA}.planned_organizations po
                JOIN {SCHEMA}.organizations o ON o.id = po.organization_id
                WHERE po.date = %s
            """, (tomorrow,))
            plans_tomorrow = cur.fetchall()

            # Для каждого плана смотрим назначены ли промоутеры
            cur.execute(f"""
                SELECT pp.plan_id, u.name as promoter_name, pp.time_slot
                FROM {SCHEMA}.plan_promoters pp
                JOIN {SCHEMA}.users u ON u.id = pp.promoter_id
                WHERE pp.plan_id IN (
                    SELECT id FROM {SCHEMA}.planned_organizations WHERE date = %s
                )
            """, (tomorrow,))
            assigned_rows = cur.fetchall()

            assigned_by_plan: Dict[int, list] = {}
            for plan_id, pname, slot in assigned_rows:
                assigned_by_plan.setdefault(plan_id, []).append(pname)

            empty_slots = []
            for plan_id, org_name, time_from, time_to in plans_tomorrow:
                assignees = assigned_by_plan.get(plan_id, [])
                if not assignees:
                    time_label = ''
                    if time_from and time_to:
                        tf = str(time_from)[:5]
                        tt = str(time_to)[:5]
                        time_label = f' {tf}–{tt}'
                    empty_slots.append(f'• {org_name}{time_label}')

    # === Формируем сообщение ===
    day_ru = today.strftime('%d.%m.%Y')
    tomorrow_ru = tomorrow.strftime('%d.%m.%Y')
    weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    day_name = weekdays[today.weekday()]
    tomorrow_name = weekdays[tomorrow.weekday()]

    lines = [f'📊 <b>Итоги дня — {day_ru} ({day_name})</b>\n']

    # Контакты
    lines.append(f'👥 <b>Контакты за день: {total_contacts}</b>')
    for name, cnt in contacts_rows[:8]:
        lines.append(f'  • {name}: {cnt}')
    if not contacts_rows:
        lines.append('  — нет контактов')
    lines.append('')

    # КМС
    kms_str = f'{total_kms:,} ₽'.replace(',', ' ')
    lines.append(f'💰 <b>Доход за день: {kms_str}</b>')
    lines.append('')

    # Незаполненные слоты
    lines.append(f'📅 <b>Завтра ({tomorrow_ru}, {tomorrow_name}) — незаполненные слоты:</b>')
    if empty_slots:
        lines.append('❗ Нет промоутера:')
        for s in empty_slots[:10]:
            lines.append(s)
    else:
        lines.append('✅ Все слоты заполнены')

    message = '\n'.join(lines)
    send_telegram_message(message)

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({
            'ok': True,
            'date': str(today),
            'total_contacts': total_contacts,
            'total_kms': total_kms,
            'empty_slots_tomorrow': len(empty_slots)
        })
    }