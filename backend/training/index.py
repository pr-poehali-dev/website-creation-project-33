'''
API для управления записями обучения стажёров.
Поддерживает CRUD для записей обучения и управление списком старших.
Args: event с httpMethod, body, headers; context с request_id
Returns: JSON с данными обучения
'''

import json
import os
import psycopg2
from datetime import datetime

SCHEMA = 't_p24058207_website_creation_pro'

CORS_HEADERS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
}

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data):
    return {'statusCode': 200, 'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {**CORS_HEADERS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg}, ensure_ascii=False)}

def handler(event: dict, context) -> dict:
    '''Обработчик API обучения'''
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS_HEADERS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    body = {}
    if event.get('body'):
        body = json.loads(event['body'])
        if not action:
            action = body.get('action', '')

    conn = get_db()
    cur = conn.cursor()

    try:
        # ---- SENIORS ----
        if action == 'get_seniors':
            cur.execute(f'SELECT id, name FROM {SCHEMA}.training_seniors ORDER BY name')
            rows = cur.fetchall()
            return ok({'seniors': [{'id': r[0], 'name': r[1]} for r in rows]})

        if action == 'add_senior':
            name = body.get('name', '').strip()
            if not name:
                return err('name required')
            cur.execute(f'INSERT INTO {SCHEMA}.training_seniors (name) VALUES (%s) ON CONFLICT (name) DO NOTHING RETURNING id, name', (name,))
            row = cur.fetchone()
            conn.commit()
            if row:
                return ok({'senior': {'id': row[0], 'name': row[1]}})
            cur.execute(f'SELECT id, name FROM {SCHEMA}.training_seniors WHERE name = %s', (name,))
            row = cur.fetchone()
            return ok({'senior': {'id': row[0], 'name': row[1]}})

        if action == 'rename_senior':
            old_name = body.get('old_name', '').strip()
            new_name = body.get('new_name', '').strip()
            if not old_name or not new_name:
                return err('old_name and new_name required')
            cur.execute(f'UPDATE {SCHEMA}.training_seniors SET name = %s WHERE name = %s', (new_name, old_name))
            cur.execute(f'UPDATE {SCHEMA}.training_entries SET senior_name = %s WHERE senior_name = %s', (new_name, old_name))
            conn.commit()
            return ok({'ok': True})

        if action == 'delete_senior':
            name = body.get('name', '').strip()
            cur.execute(f'DELETE FROM {SCHEMA}.training_seniors WHERE name = %s', (name,))
            conn.commit()
            return ok({'ok': True})

        # ---- ENTRIES ----
        if action == 'get_entries':
            date = params.get('date') or body.get('date')
            if not date:
                return err('date required')
            cur.execute(f'''
                SELECT id, date, senior_name, promoter_name, promoter_phone, organization, time, comment
                FROM {SCHEMA}.training_entries WHERE date = %s ORDER BY id
            ''', (date,))
            rows = cur.fetchall()
            entries = [{'id': r[0], 'date': str(r[1]), 'seniorName': r[2], 'promoterName': r[3],
                        'promoterPhone': r[4], 'organization': r[5], 'time': r[6], 'comment': r[7]} for r in rows]
            return ok({'entries': entries})

        if action == 'add_entry':
            d = body
            cur.execute(f'''
                INSERT INTO {SCHEMA}.training_entries (date, senior_name, promoter_name, promoter_phone, organization, time, comment)
                VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING id
            ''', (d.get('date'), d.get('seniorName'), d.get('promoterName'),
                  d.get('promoterPhone', ''), d.get('organization', ''), d.get('time', ''), d.get('comment', '')))
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({'id': new_id})

        if action == 'update_entry':
            d = body
            cur.execute(f'''
                UPDATE {SCHEMA}.training_entries
                SET senior_name=%s, promoter_name=%s, promoter_phone=%s, organization=%s, time=%s, comment=%s, updated_at=NOW()
                WHERE id=%s
            ''', (d.get('seniorName'), d.get('promoterName'), d.get('promoterPhone', ''),
                  d.get('organization', ''), d.get('time', ''), d.get('comment', ''), d.get('id')))
            conn.commit()
            return ok({'ok': True})

        if action == 'delete_entry':
            entry_id = body.get('id')
            cur.execute(f'DELETE FROM {SCHEMA}.training_entries WHERE id = %s', (entry_id,))
            conn.commit()
            return ok({'ok': True})

        # ---- KPD ----
        if action == 'get_senior_kpd':
            from datetime import timedelta, date as date_type
            senior_id = params.get('senior_id') or body.get('senior_id')
            if not senior_id:
                return err('senior_id required')

            msk = timedelta(hours=3)

            # Все стажёры этого старшего
            cur.execute(f'''
                SELECT u.id, u.name, u.created_at, u.is_active
                FROM {SCHEMA}.users u
                WHERE u.senior_id = %s
                ORDER BY u.created_at DESC
            ''', (senior_id,))
            trainee_rows = cur.fetchall()
            user_ids = [r[0] for r in trainee_rows]

            # Все лиды стажёров + даты МСК
            leads_by_user = {}  # user_id -> list of msk_date
            shifts_by_user = {}  # user_id -> set of (msk_date, org_id)
            if user_ids:
                placeholders = ','.join(str(uid) for uid in user_ids)
                cur.execute(f'''
                    SELECT user_id, created_at, organization_id
                    FROM {SCHEMA}.leads_analytics
                    WHERE user_id IN ({placeholders}) AND is_active = true
                ''')
                for uid, created_at, org_id in cur.fetchall():
                    if created_at:
                        if hasattr(created_at, 'tzinfo') and created_at.tzinfo:
                            msk_date = (created_at + msk).date()
                        else:
                            msk_date = created_at.date()
                        leads_by_user.setdefault(uid, []).append(msk_date)
                        shifts_by_user.setdefault(uid, set()).add((msk_date, org_id))

            def trainee_info(r, lead_dates=None):
                uid, name, created_at, is_active = r
                if lead_dates is None:
                    cnt = len(leads_by_user.get(uid, []))
                else:
                    cnt = len(lead_dates)
                return {
                    'id': uid,
                    'name': name,
                    'registered_at': str(created_at),
                    'is_active': is_active,
                    'lead_count': cnt,
                    'shifts_count': len(shifts_by_user.get(uid, set())),
                }

            def period_summary(trainees_list):
                total_leads = sum(t['lead_count'] for t in trainees_list)
                inactive = sum(1 for t in trainees_list if not t['is_active'])
                return {
                    'trainees_count': len(trainees_list),
                    'inactive_count': inactive,
                    'total_leads': total_leads,
                }

            # --- by_day ---
            cur.execute(f'''
                SELECT DATE(created_at) as day, COUNT(*) as cnt
                FROM {SCHEMA}.users
                WHERE senior_id = %s
                GROUP BY DATE(created_at)
                ORDER BY day DESC
                LIMIT 90
            ''', (senior_id,))
            day_rows = cur.fetchall()

            by_day = []
            for day_date, cnt in day_rows:
                day_trainees = []
                for r in trainee_rows:
                    uid = r[0]
                    reg_date = r[2].date() if hasattr(r[2], 'date') else date_type.fromisoformat(str(r[2])[:10])
                    if reg_date == day_date:
                        # контакты этого стажёра за этот день
                        day_leads = [d for d in leads_by_user.get(uid, []) if d == day_date]
                        day_trainees.append(trainee_info(r, day_leads))
                by_day.append({
                    'date': str(day_date),
                    'count': cnt,
                    'trainees': day_trainees,
                    'summary': period_summary(day_trainees),
                })

            # --- by_week ---
            cur.execute(f'''
                SELECT DATE_TRUNC('week', created_at)::date as week_start, COUNT(*) as cnt
                FROM {SCHEMA}.users
                WHERE senior_id = %s
                GROUP BY DATE_TRUNC('week', created_at)
                ORDER BY week_start DESC
                LIMIT 12
            ''', (senior_id,))
            week_rows = cur.fetchall()

            by_week = []
            for week_start, cnt in week_rows:
                week_end = week_start + timedelta(days=6)
                week_trainees = []
                for r in trainee_rows:
                    uid = r[0]
                    reg_date = r[2].date() if hasattr(r[2], 'date') else date_type.fromisoformat(str(r[2])[:10])
                    if week_start <= reg_date <= week_end:
                        week_leads = [d for d in leads_by_user.get(uid, []) if week_start <= d <= week_end]
                        week_trainees.append(trainee_info(r, week_leads))
                by_week.append({
                    'week_start': str(week_start),
                    'count': cnt,
                    'trainees': week_trainees,
                    'summary': period_summary(week_trainees),
                })

            # --- by_month ---
            cur.execute(f'''
                SELECT DATE_TRUNC('month', created_at)::date as month_start, COUNT(*) as cnt
                FROM {SCHEMA}.users
                WHERE senior_id = %s
                GROUP BY DATE_TRUNC('month', created_at)
                ORDER BY month_start DESC
                LIMIT 12
            ''', (senior_id,))
            month_rows = cur.fetchall()

            by_month = []
            for month_start, cnt in month_rows:
                next_month = (month_start.replace(day=28) + timedelta(days=4)).replace(day=1)
                month_trainees = []
                for r in trainee_rows:
                    uid = r[0]
                    reg_date = r[2].date() if hasattr(r[2], 'date') else date_type.fromisoformat(str(r[2])[:10])
                    if month_start <= reg_date < next_month:
                        month_leads = [d for d in leads_by_user.get(uid, []) if month_start <= d < next_month]
                        month_trainees.append(trainee_info(r, month_leads))
                by_month.append({
                    'month_start': str(month_start),
                    'count': cnt,
                    'trainees': month_trainees,
                    'summary': period_summary(month_trainees),
                })

            return ok({'by_day': by_day, 'by_week': by_week, 'by_month': by_month})

        return err('unknown action')

    finally:
        cur.close()
        conn.close()