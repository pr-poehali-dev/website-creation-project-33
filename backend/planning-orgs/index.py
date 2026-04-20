"""
Планирование организаций в календаре.
CRUD для таблицы planned_organizations.
GET  ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD  — список планов за диапазон
POST  action=create   — создать план
PUT   id=N            — обновить план
DELETE ?id=N          — удалить план
GET  ?action=meta     — список организаций и старших для выпадающих списков
"""
import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])


HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
    'Content-Type': 'application/json',
}

SCHEMA = 't_p24058207_website_creation_pro'


def handler(event: dict, context) -> dict:
    """Планирование организаций на дни календаря."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    conn = get_conn()
    cur = conn.cursor()

    try:
        # GET meta — организации и старшие
        if method == 'GET' and params.get('action') == 'meta':
            cur.execute(
                f"SELECT id, name FROM {SCHEMA}.organizations WHERE is_active = true ORDER BY name"
            )
            orgs = [{'id': r[0], 'name': r[1]} for r in cur.fetchall()]

            cur.execute(
                f"""SELECT DISTINCT s.id, s.name
                    FROM {SCHEMA}.users s
                    WHERE s.id IN (
                        SELECT DISTINCT senior_id FROM {SCHEMA}.users
                        WHERE senior_id IS NOT NULL
                    )
                    ORDER BY s.name"""
            )
            seniors = [{'id': r[0], 'name': r[1]} for r in cur.fetchall()]

            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'organizations': orgs, 'seniors': seniors})}

        # GET список планов
        if method == 'GET':
            date_from = params.get('date_from')
            date_to = params.get('date_to')

            sql = f"""
                SELECT po.id, po.organization_id, o.name as org_name,
                       po.date, po.senior_id, u.name as senior_name,
                       po.color, po.contact_limit, po.notes, po.created_at
                FROM {SCHEMA}.planned_organizations po
                JOIN {SCHEMA}.organizations o ON o.id = po.organization_id
                LEFT JOIN {SCHEMA}.users u ON u.id = po.senior_id
                WHERE 1=1
            """
            args = []
            if date_from:
                sql += ' AND po.date >= %s'
                args.append(date_from)
            if date_to:
                sql += ' AND po.date <= %s'
                args.append(date_to)
            sql += ' ORDER BY po.date, po.created_at'

            cur.execute(sql, args)
            rows = cur.fetchall()
            plans = []
            for r in rows:
                plans.append({
                    'id': r[0],
                    'organization_id': r[1],
                    'organization_name': r[2],
                    'date': str(r[3]),
                    'senior_id': r[4],
                    'senior_name': r[5],
                    'color': r[6],
                    'contact_limit': r[7],
                    'notes': r[8],
                    'created_at': str(r[9]),
                })
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'plans': plans})}

        # POST — создать
        if method == 'POST':
            org_id = body.get('organization_id')
            date = body.get('date')
            senior_id = body.get('senior_id') or None
            color = body.get('color', '#3b82f6')
            contact_limit = body.get('contact_limit') or None
            notes = body.get('notes') or None

            if not org_id or not date:
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'organization_id and date required'})}

            cur.execute(
                f"""INSERT INTO {SCHEMA}.planned_organizations
                    (organization_id, date, senior_id, color, contact_limit, notes)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id, created_at""",
                (org_id, date, senior_id, color, contact_limit, notes)
            )
            row = cur.fetchone()
            conn.commit()

            cur.execute(
                f"""SELECT po.id, po.organization_id, o.name, po.date,
                           po.senior_id, u.name, po.color, po.contact_limit, po.notes, po.created_at
                    FROM {SCHEMA}.planned_organizations po
                    JOIN {SCHEMA}.organizations o ON o.id = po.organization_id
                    LEFT JOIN {SCHEMA}.users u ON u.id = po.senior_id
                    WHERE po.id = %s""",
                (row[0],)
            )
            r = cur.fetchone()
            plan = {
                'id': r[0], 'organization_id': r[1], 'organization_name': r[2],
                'date': str(r[3]), 'senior_id': r[4], 'senior_name': r[5],
                'color': r[6], 'contact_limit': r[7], 'notes': r[8], 'created_at': str(r[9]),
            }
            return {'statusCode': 201, 'headers': HEADERS, 'body': json.dumps({'plan': plan})}

        # PUT — обновить
        if method == 'PUT':
            plan_id = body.get('id') or params.get('id')
            if not plan_id:
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'id required'})}

            fields = []
            vals = []
            for key in ('organization_id', 'date', 'senior_id', 'color', 'contact_limit', 'notes'):
                if key in body:
                    fields.append(f'{key} = %s')
                    vals.append(body[key] if body[key] != '' else None)

            if not fields:
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'nothing to update'})}

            vals.append(plan_id)
            cur.execute(
                f"UPDATE {SCHEMA}.planned_organizations SET {', '.join(fields)} WHERE id = %s",
                vals
            )
            conn.commit()

            cur.execute(
                f"""SELECT po.id, po.organization_id, o.name, po.date,
                           po.senior_id, u.name, po.color, po.contact_limit, po.notes, po.created_at
                    FROM {SCHEMA}.planned_organizations po
                    JOIN {SCHEMA}.organizations o ON o.id = po.organization_id
                    LEFT JOIN {SCHEMA}.users u ON u.id = po.senior_id
                    WHERE po.id = %s""",
                (plan_id,)
            )
            r = cur.fetchone()
            plan = {
                'id': r[0], 'organization_id': r[1], 'organization_name': r[2],
                'date': str(r[3]), 'senior_id': r[4], 'senior_name': r[5],
                'color': r[6], 'contact_limit': r[7], 'notes': r[8], 'created_at': str(r[9]),
            }
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'plan': plan})}

        # DELETE — удалить
        if method == 'DELETE':
            plan_id = params.get('id')
            if not plan_id:
                return {'statusCode': 400, 'headers': HEADERS, 'body': json.dumps({'error': 'id required'})}
            cur.execute(f"DELETE FROM {SCHEMA}.planned_organizations WHERE id = %s", (plan_id,))
            conn.commit()
            return {'statusCode': 200, 'headers': HEADERS, 'body': json.dumps({'ok': True})}

        return {'statusCode': 405, 'headers': HEADERS, 'body': json.dumps({'error': 'method not allowed'})}

    finally:
        cur.close()
        conn.close()