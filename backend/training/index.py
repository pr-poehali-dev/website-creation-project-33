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

        return err('unknown action')

    finally:
        cur.close()
        conn.close()
