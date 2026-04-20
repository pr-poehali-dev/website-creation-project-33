"""
Планирование организаций в календаре.
CRUD для таблицы planned_organizations.
GET  ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD  — список планов за диапазон
GET  ?action=meta — список организаций и старших
GET  ?action=promoters&date=YYYY-MM-DD — промоутеры, проставившие смену на дату
POST  — создать план
PUT   — обновить план (в т.ч. назначить промоутера)
DELETE ?id=N — удалить план
"""
import json
import os
import psycopg2
from datetime import datetime, date as date_type, timedelta


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
           po.color, po.contact_limit, po.notes, po.created_at,
           po.time_from, po.time_to,
           po.promoter_id, u.name as promoter_name,
           po.promoter_org_name, po.promoter_place_type,
           po.promoter_address, po.promoter_leaflets
    FROM {SCHEMA}.planned_organizations po
    JOIN {SCHEMA}.organizations o ON o.id = po.organization_id
    LEFT JOIN {SCHEMA}.training_seniors ts ON ts.id = po.senior_ts_id
    LEFT JOIN {SCHEMA}.users u ON u.id = po.promoter_id
"""

# slot1 = 12:00-16:00, slot2 = 16:00-20:00
SLOT_TIMES = {
    'slot1': {'from': '12:00', 'to': '16:00'},
    'slot2': {'from': '16:00', 'to': '20:00'},
}


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
        'time_from': r[10],
        'time_to': r[11],
        'promoter_id': r[12],
        'promoter_name': r[13],
        'promoter_org_name': r[14],
        'promoter_place_type': r[15],
        'promoter_address': r[16],
        'promoter_leaflets': r[17],
    }


def ok(data, status=200):
    return {'statusCode': status, 'headers': HEADERS, 'body': json.dumps(data, default=str)}


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

        # GET promoters — промоутеры, у которых есть смена на указанную дату
        # Логика: смотрим promoter_schedules, schedule_data[date][slotN] = true
        # Возвращаем список с указанием доступных слотов и сколько раз уже использованы
        if method == 'GET' and params.get('action') == 'promoters':
            target_date = params.get('date')
            if not target_date:
                return err('date required')

            # Найдём понедельник недели для этой даты
            dt = datetime.strptime(target_date, '%Y-%m-%d')
            monday = dt - timedelta(days=dt.weekday())
            week_start = monday.strftime('%Y-%m-%d')

            # Промоутеры с выбранными слотами на эту дату
            cur.execute(f"""
                SELECT ps.user_id, u.name,
                       ps.schedule_data->%s->>'slot1' as slot1,
                       ps.schedule_data->%s->>'slot2' as slot2
                FROM {SCHEMA}.promoter_schedules ps
                JOIN {SCHEMA}.users u ON u.id = ps.user_id
                WHERE ps.week_start_date = %s
                  AND (
                    ps.schedule_data->%s->>'slot1' = 'true'
                    OR ps.schedule_data->%s->>'slot2' = 'true'
                  )
                ORDER BY u.name
            """, (target_date, target_date, week_start, target_date, target_date))

            promoters_raw = cur.fetchall()

            # Узнаём, сколько раз каждый промоутер уже назначен на этот день
            cur.execute(f"""
                SELECT promoter_id, COUNT(*) as usage_count
                FROM {SCHEMA}.planned_organizations
                WHERE date = %s AND promoter_id IS NOT NULL
                GROUP BY promoter_id
            """, (target_date,))
            usage_map = {row[0]: row[1] for row in cur.fetchall()}

            promoters = []
            for row in promoters_raw:
                user_id, name, slot1_str, slot2_str = row
                slot1 = slot1_str == 'true'
                slot2 = slot2_str == 'true'
                total_slots = (1 if slot1 else 0) + (1 if slot2 else 0)
                used = usage_map.get(user_id, 0)
                available_slots = []
                if slot1:
                    available_slots.append({'key': 'slot1', 'label': '12:00–16:00', **SLOT_TIMES['slot1']})
                if slot2:
                    available_slots.append({'key': 'slot2', 'label': '16:00–20:00', **SLOT_TIMES['slot2']})
                promoters.append({
                    'id': user_id,
                    'name': name,
                    'total_slots': total_slots,
                    'used_slots': used,
                    'available': used < total_slots,
                    'slots': available_slots,
                })

            return ok({'promoters': promoters})

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
            sql += " ORDER BY po.date, COALESCE(po.time_from, '99:99'), po.created_at"

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
            time_from = body.get('time_from') or None
            time_to = body.get('time_to') or None
            promoter_id = body.get('promoter_id') or None
            promoter_org_name = body.get('promoter_org_name') or None
            promoter_place_type = body.get('promoter_place_type') or None
            promoter_address = body.get('promoter_address') or None
            promoter_leaflets = body.get('promoter_leaflets') or None

            cur.execute(
                f"""INSERT INTO {SCHEMA}.planned_organizations
                    (organization_id, date, senior_ts_id, color, contact_limit, notes, time_from, time_to,
                     promoter_id, promoter_org_name, promoter_place_type, promoter_address, promoter_leaflets)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id""",
                (org_id, date, senior_id, color, contact_limit, notes, time_from, time_to,
                 promoter_id, promoter_org_name, promoter_place_type, promoter_address, promoter_leaflets)
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
                'senior_id': 'senior_ts_id',
                'color': 'color',
                'contact_limit': 'contact_limit',
                'notes': 'notes',
                'time_from': 'time_from',
                'time_to': 'time_to',
                'promoter_id': 'promoter_id',
                'promoter_org_name': 'promoter_org_name',
                'promoter_place_type': 'promoter_place_type',
                'promoter_address': 'promoter_address',
                'promoter_leaflets': 'promoter_leaflets',
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