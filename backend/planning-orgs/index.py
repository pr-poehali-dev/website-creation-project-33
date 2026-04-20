"""
Планирование организаций в календаре.
CRUD для таблицы planned_organizations.
GET  ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD  — список планов за диапазон
POST  — создать план
PUT   — обновить план
DELETE ?id=N — удалить план
GET  ?action=meta — список организаций и старших
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

SELECT_PLAN = f"""
    SELECT po.id, po.organization_id, o.name as org_name,
           po.date, po.senior_ts_id, ts.name as senior_name,
           po.color, po.contact_limit, po.notes, po.created_at
    FROM {SCHEMA}.planned_organizations po
    JOIN {SCHEMA}.organizations o ON o.id = po.organization_id
    LEFT JOIN {SCHEMA}.training_seniors ts ON ts.id = po.senior_ts_id
"""


def row_to_plan(r):
    return {
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
    }


def ok(data, status=200):
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps(data)}


def err(msg, status=400):
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps({'error': msg})}


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
            cur.execute(f"SELECT id, name FROM {SCHEMA}.organizations WHERE is_active = true ORDER BY name")
            orgs = [{'id': r[0], 'name': r[1]} for r in cur.fetchall()]

            cur.execute(f"SELECT id, name FROM {SCHEMA}.training_seniors ORDER BY name")
            seniors = [{'id': r[0], 'name': r[1]} for r in cur.fetchall()]

            return ok({'organizations': orgs, 'seniors': seniors})

        # GET список планов
        if method == 'GET':
            date_from = params.get('date_from')
            date_to = params.get('date_to')

            sql = SELECT_PLAN + ' WHERE 1=1'
            args = []
            if date_from:
                sql += ' AND po.date >= %s'
                args.append(date_from)
            if date_to:
                sql += ' AND po.date <= %s'
                args.append(date_to)
            sql += ' ORDER BY po.date, po.created_at'

            cur.execute(sql, args)
            return ok({'plans': [row_to_plan(r) for r in cur.fetchall()]})

        # POST — создать
        if method == 'POST':
            org_id = body.get('organization_id')
            date = body.get('date')
            if not org_id or not date:
                return err('organization_id and date required')

            senior_id = body.get('senior_id') or None
            color = body.get('color', '#3b82f6')
            contact_limit = body.get('contact_limit') or None
            notes = body.get('notes') or None

            cur.execute(
                f"""INSERT INTO {SCHEMA}.planned_organizations
                    (organization_id, date, senior_ts_id, color, contact_limit, notes)
                    VALUES (%s, %s, %s, %s, %s, %s)
                    RETURNING id""",
                (org_id, date, senior_id, color, contact_limit, notes)
            )
            new_id = cur.fetchone()[0]
            conn.commit()

            cur.execute(SELECT_PLAN + ' WHERE po.id = %s', (new_id,))
            return ok({'plan': row_to_plan(cur.fetchone())}, 201)

        # PUT — обновить
        if method == 'PUT':
            plan_id = body.get('id') or params.get('id')
            if not plan_id:
                return err('id required')

            fields = []
            vals = []
            mapping = {
                'organization_id': 'organization_id',
                'date': 'date',
                'senior_id': 'senior_ts_id',  # фронт шлёт senior_id → пишем в senior_ts_id
                'color': 'color',
                'contact_limit': 'contact_limit',
                'notes': 'notes',
            }
            for front_key, db_col in mapping.items():
                if front_key in body:
                    fields.append(f'{db_col} = %s')
                    v = body[front_key]
                    vals.append(None if v == '' else v)

            if not fields:
                return err('nothing to update')

            vals.append(plan_id)
            cur.execute(
                f"UPDATE {SCHEMA}.planned_organizations SET {', '.join(fields)} WHERE id = %s",
                vals
            )
            conn.commit()

            cur.execute(SELECT_PLAN + ' WHERE po.id = %s', (plan_id,))
            row = cur.fetchone()
            if not row:
                return err('plan not found', 404)
            return ok({'plan': row_to_plan(row)})

        # DELETE — удалить
        if method == 'DELETE':
            plan_id = params.get('id')
            if not plan_id:
                return err('id required')
            cur.execute(f"DELETE FROM {SCHEMA}.planned_organizations WHERE id = %s", (plan_id,))
            conn.commit()
            return ok({'ok': True})

        return err('method not allowed', 405)

    finally:
        cur.close()
        conn.close()
