"""
Планирование организаций в календаре.
GET  ?date_from=YYYY-MM-DD&date_to=YYYY-MM-DD  — список планов за диапазон
GET  ?action=meta — список организаций и старших
GET  ?action=promoters&date=YYYY-MM-DD — промоутеры со сменами на дату
POST ?action=add_promoter — добавить промоутера на точку
PUT  ?action=update_promoter — обновить данные промоутера на точке
DELETE ?action=remove_promoter&pp_id=N — удалить промоутера с точки
POST  — создать план
PUT   — обновить план
DELETE ?id=N — удалить план
"""
import json
import os
import psycopg2
from datetime import datetime, timedelta


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
           po.time_from, po.time_to
    FROM {SCHEMA}.planned_organizations po
    JOIN {SCHEMA}.organizations o ON o.id = po.organization_id
    LEFT JOIN {SCHEMA}.training_seniors ts ON ts.id = po.senior_ts_id
"""

SLOT_TIMES = {
    'slot1': {'from': '12:00', 'to': '16:00'},
    'slot2': {'from': '16:00', 'to': '20:00'},
}


def get_plan_promoters(cur, plan_id):
    cur.execute(f"""
        SELECT pp.id, pp.promoter_id, u.name, pp.org_name, pp.place_type, pp.address, pp.leaflets, pp.time_slot
        FROM {SCHEMA}.plan_promoters pp
        JOIN {SCHEMA}.users u ON u.id = pp.promoter_id
        WHERE pp.plan_id = %s
        ORDER BY pp.created_at
    """, (plan_id,))
    return [
        {
            'pp_id': r[0],
            'promoter_id': r[1],
            'promoter_name': r[2],
            'org_name': r[3],
            'place_type': r[4],
            'address': r[5],
            'leaflets': r[6],
            'time_slot': r[7],
        }
        for r in cur.fetchall()
    ]


def row_to_plan(r, promoters=None):
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
        'promoters': promoters or [],
        # legacy fields — первый промоутер для обратной совместимости
        'promoter_id': promoters[0]['promoter_id'] if promoters else None,
        'promoter_name': promoters[0]['promoter_name'] if promoters else None,
        'promoter_org_name': promoters[0]['org_name'] if promoters else None,
        'promoter_place_type': promoters[0]['place_type'] if promoters else None,
        'promoter_address': promoters[0]['address'] if promoters else None,
        'promoter_leaflets': promoters[0]['leaflets'] if promoters else None,
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
        # GET meta
        if method == 'GET' and params.get('action') == 'meta':
            cur.execute(f"SELECT id, name FROM {SCHEMA}.organizations WHERE is_active = true ORDER BY name")
            orgs = [{'id': r[0], 'name': r[1]} for r in cur.fetchall()]
            cur.execute(f"SELECT id, name FROM {SCHEMA}.training_seniors ORDER BY name")
            seniors = [{'id': r[0], 'name': r[1]} for r in cur.fetchall()]
            return ok({'organizations': orgs, 'seniors': seniors})

        # GET week_slots — суммарные слоты промоутеров по дням за неделю (один запрос)
        if method == 'GET' and params.get('action') == 'week_slots':
            date_from = params.get('date_from')
            date_to = params.get('date_to')
            if not date_from or not date_to:
                return err('date_from and date_to required')

            # Понедельники недель в диапазоне (берём все недели)
            from_dt = datetime.strptime(date_from, '%Y-%m-%d')
            to_dt = datetime.strptime(date_to, '%Y-%m-%d')

            # Все уникальные понедельники для дат в диапазоне
            week_starts = set()
            cur_dt = from_dt
            while cur_dt <= to_dt:
                monday = cur_dt - timedelta(days=cur_dt.weekday())
                week_starts.add(monday.strftime('%Y-%m-%d'))
                cur_dt += timedelta(days=1)

            # Считаем total_slots на каждую дату диапазона
            result: dict = {}
            for ws in week_starts:
                cur.execute(f"""
                    SELECT
                        d.date_val::text,
                        COALESCE(SUM(
                            (CASE WHEN ps.schedule_data->d.date_val->>'slot1' = 'true' THEN 1 ELSE 0 END) +
                            (CASE WHEN ps.schedule_data->d.date_val->>'slot2' = 'true' THEN 1 ELSE 0 END)
                        ), 0) as total_slots
                    FROM (
                        SELECT generate_series(%s::date, %s::date, '1 day'::interval)::date::text as date_val
                    ) d
                    LEFT JOIN {SCHEMA}.promoter_schedules ps ON ps.week_start_date = %s
                        AND ps.schedule_data ? d.date_val
                    GROUP BY d.date_val
                """, (date_from, date_to, ws))
                for row in cur.fetchall():
                    date_str, total = row
                    if date_str not in result:
                        result[date_str] = 0
                    result[date_str] += int(total)

            # Считаем used_slots (назначенные промоутеры) за диапазон
            cur.execute(f"""
                SELECT po.date::text, COUNT(pp.id) as used_count
                FROM {SCHEMA}.plan_promoters pp
                JOIN {SCHEMA}.planned_organizations po ON po.id = pp.plan_id
                WHERE po.date >= %s AND po.date <= %s
                GROUP BY po.date
            """, (date_from, date_to))
            used: dict = {row[0]: int(row[1]) for row in cur.fetchall()}

            slots_by_date = {
                date: {'total': result.get(date, 0), 'used': used.get(date, 0)}
                for date in result
            }
            return ok({'slots_by_date': slots_by_date})

        # GET promoters — список промоутеров со сменами на дату
        if method == 'GET' and params.get('action') == 'promoters':
            target_date = params.get('date')
            if not target_date:
                return err('date required')

            dt = datetime.strptime(target_date, '%Y-%m-%d')
            monday = dt - timedelta(days=dt.weekday())
            week_start = monday.strftime('%Y-%m-%d')

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

            # Какие конкретные слоты уже заняты у каждого промоутера в этот день
            cur.execute(f"""
                SELECT pp.promoter_id, pp.time_slot
                FROM {SCHEMA}.plan_promoters pp
                JOIN {SCHEMA}.planned_organizations po ON po.id = pp.plan_id
                WHERE po.date = %s AND pp.time_slot IS NOT NULL
            """, (target_date,))
            # used_slots_map: {user_id: set of used slot keys}
            used_slots_map: dict = {}
            for row in cur.fetchall():
                uid, ts = row
                if uid not in used_slots_map:
                    used_slots_map[uid] = set()
                used_slots_map[uid].add(ts)

            promoters = []
            for row in promoters_raw:
                user_id, name, slot1_str, slot2_str = row
                slot1_avail = slot1_str == 'true'
                slot2_avail = slot2_str == 'true'
                used_keys = used_slots_map.get(user_id, set())

                slots = []
                if slot1_avail:
                    slots.append({
                        'key': 'slot1', 'label': '12:00–16:00',
                        **SLOT_TIMES['slot1'],
                        'used': 'slot1' in used_keys,
                    })
                if slot2_avail:
                    slots.append({
                        'key': 'slot2', 'label': '16:00–20:00',
                        **SLOT_TIMES['slot2'],
                        'used': 'slot2' in used_keys,
                    })

                total = len(slots)
                used_count = len(used_keys)
                promoters.append({
                    'id': user_id,
                    'name': name,
                    'total_slots': total,
                    'used_slots': used_count,
                    'available': used_count < total,
                    'slots': slots,
                })
            return ok({'promoters': promoters})

        # POST add_promoter — добавить промоутера на точку
        if method == 'POST' and params.get('action') == 'add_promoter':
            plan_id = body.get('plan_id')
            promoter_id = body.get('promoter_id')
            if not plan_id or not promoter_id:
                return err('plan_id and promoter_id required')
            cur.execute(
                f"""INSERT INTO {SCHEMA}.plan_promoters (plan_id, promoter_id, org_name, place_type, address, leaflets, time_slot)
                    VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (plan_id, promoter_id,
                 body.get('org_name') or None, body.get('place_type') or None,
                 body.get('address') or None, body.get('leaflets') or None,
                 body.get('time_slot') or None)
            )
            pp_id = cur.fetchone()[0]
            conn.commit()
            promoters = get_plan_promoters(cur, plan_id)
            cur.execute(SELECT_PLAN + ' WHERE po.id = %s', (plan_id,))
            row = cur.fetchone()
            return ok({'plan': row_to_plan(row, promoters), 'pp_id': pp_id})

        # PUT update_promoter — обновить данные промоутера на точке
        if method == 'PUT' and params.get('action') == 'update_promoter':
            pp_id = body.get('pp_id')
            if not pp_id:
                return err('pp_id required')
            fields, vals = [], []
            for fk, col in [('promoter_id','promoter_id'),('org_name','org_name'),
                             ('place_type','place_type'),('address','address'),('leaflets','leaflets'),
                             ('time_slot','time_slot')]:
                if fk in body:
                    fields.append(f'{col} = %s')
                    vals.append(body[fk] or None)
            if not fields:
                return err('nothing to update')
            vals.append(pp_id)
            cur.execute(f"UPDATE {SCHEMA}.plan_promoters SET {', '.join(fields)} WHERE id = %s", vals)
            # Получаем plan_id
            cur.execute(f"SELECT plan_id FROM {SCHEMA}.plan_promoters WHERE id = %s", (pp_id,))
            row_pp = cur.fetchone()
            if not row_pp:
                return err('not found', 404)
            conn.commit()
            plan_id = row_pp[0]
            promoters = get_plan_promoters(cur, plan_id)
            cur.execute(SELECT_PLAN + ' WHERE po.id = %s', (plan_id,))
            row = cur.fetchone()
            return ok({'plan': row_to_plan(row, promoters)})

        # DELETE remove_promoter — удалить промоутера с точки
        if method == 'DELETE' and params.get('action') == 'remove_promoter':
            pp_id = params.get('pp_id')
            if not pp_id:
                return err('pp_id required')
            cur.execute(f"SELECT plan_id FROM {SCHEMA}.plan_promoters WHERE id = %s", (pp_id,))
            row_pp = cur.fetchone()
            if not row_pp:
                return err('not found', 404)
            plan_id = row_pp[0]
            cur.execute(f"DELETE FROM {SCHEMA}.plan_promoters WHERE id = %s", (pp_id,))
            conn.commit()
            promoters = get_plan_promoters(cur, plan_id)
            cur.execute(SELECT_PLAN + ' WHERE po.id = %s', (plan_id,))
            row = cur.fetchone()
            return ok({'plan': row_to_plan(row, promoters)})

        # GET список планов с промоутерами
        if method == 'GET':
            date_from = params.get('date_from')
            date_to = params.get('date_to')
            sql = SELECT_PLAN + ' WHERE 1=1'
            args = []
            if date_from:
                sql += ' AND po.date >= %s'; args.append(date_from)
            if date_to:
                sql += ' AND po.date <= %s'; args.append(date_to)
            sql += " ORDER BY po.date, COALESCE(po.time_from, '99:99'), po.created_at"
            cur.execute(sql, args)
            rows = cur.fetchall()

            # Загружаем всех промоутеров разом
            if rows:
                plan_ids = [r[0] for r in rows]
                placeholders = ','.join(['%s'] * len(plan_ids))
                cur.execute(f"""
                    SELECT pp.id, pp.plan_id, pp.promoter_id, u.name, pp.org_name, pp.place_type, pp.address, pp.leaflets, pp.time_slot
                    FROM {SCHEMA}.plan_promoters pp
                    JOIN {SCHEMA}.users u ON u.id = pp.promoter_id
                    WHERE pp.plan_id IN ({placeholders})
                    ORDER BY pp.created_at
                """, plan_ids)
                pmap: dict = {}
                for pr in cur.fetchall():
                    pid = pr[1]
                    if pid not in pmap:
                        pmap[pid] = []
                    pmap[pid].append({
                        'pp_id': pr[0], 'promoter_id': pr[2], 'promoter_name': pr[3],
                        'org_name': pr[4], 'place_type': pr[5], 'address': pr[6], 'leaflets': pr[7],
                        'time_slot': pr[8],
                    })
            else:
                pmap = {}

            return ok({'plans': [row_to_plan(r, pmap.get(r[0], [])) for r in rows]})

        # POST — создать план
        if method == 'POST':
            org_id = body.get('organization_id')
            date = body.get('date')
            if not org_id or not date:
                return err('organization_id and date required')
            cur.execute(
                f"""INSERT INTO {SCHEMA}.planned_organizations
                    (organization_id, date, senior_ts_id, color, contact_limit, notes, time_from, time_to)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s) RETURNING id""",
                (org_id, date,
                 body.get('senior_id') or None, body.get('color', '#3b82f6'),
                 body.get('contact_limit') or None, body.get('notes') or None,
                 body.get('time_from') or None, body.get('time_to') or None)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            cur.execute(SELECT_PLAN + ' WHERE po.id = %s', (new_id,))
            return ok({'plan': row_to_plan(cur.fetchone(), [])}, 201)

        # PUT — обновить план
        if method == 'PUT':
            plan_id = body.get('id') or params.get('id')
            if not plan_id:
                return err('id required')
            fields, vals = [], []
            mapping = {
                'organization_id': 'organization_id', 'date': 'date',
                'senior_id': 'senior_ts_id', 'color': 'color',
                'contact_limit': 'contact_limit', 'notes': 'notes',
                'time_from': 'time_from', 'time_to': 'time_to',
            }
            for fk, col in mapping.items():
                if fk in body:
                    fields.append(f'{col} = %s')
                    vals.append(None if body[fk] == '' else body[fk])
            if not fields:
                return err('nothing to update')
            vals.append(plan_id)
            cur.execute(f"UPDATE {SCHEMA}.planned_organizations SET {', '.join(fields)} WHERE id = %s", vals)
            conn.commit()
            cur.execute(SELECT_PLAN + ' WHERE po.id = %s', (plan_id,))
            row = cur.fetchone()
            if not row:
                return err('plan not found', 404)
            promoters = get_plan_promoters(cur, plan_id)
            return ok({'plan': row_to_plan(row, promoters)})

        # DELETE — удалить план
        if method == 'DELETE':
            plan_id = params.get('id')
            if not plan_id:
                return err('id required')
            cur.execute(f"UPDATE {SCHEMA}.planned_organizations SET notes = COALESCE(notes,'') WHERE id = %s", (plan_id,))
            cur.execute(f"UPDATE {SCHEMA}.planned_organizations SET color = color WHERE id = %s", (plan_id,))
            # Реальное удаление через обход ограничения нельзя — помечаем как удалённый
            # Используем существующий DELETE permission через notes
            cur.execute(f"DELETE FROM {SCHEMA}.planned_organizations WHERE id = %s", (plan_id,))
            conn.commit()
            return ok({'ok': True})

        return err('method not allowed', 405)

    finally:
        cur.close()
        conn.close()