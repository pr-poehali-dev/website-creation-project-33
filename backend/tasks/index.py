import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление задачами: CRUD для задач и категорий.
    GET /  — список задач (фильтры: responsible, category_id, status)
    GET /?action=categories — список категорий
    POST / — создать задачу или категорию
    PUT / — обновить статус задачи
    '''
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()

    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            action = params.get('action', '')

            if action == 'categories':
                cur.execute('SELECT id, name FROM task_categories ORDER BY name')
                cats = [{'id': r[0], 'name': r[1]} for r in cur.fetchall()]
                return _ok({'categories': cats})

            # Список задач с фильтрами, сортировка: pending > in_progress > done, внутри — по дате DESC
            responsible = params.get('responsible', '')
            category_id = params.get('category_id', '')
            status = params.get('status', '')

            sql = '''
                SELECT t.id, t.text, t.responsible, t.category_id, tc.name AS category_name,
                       t.status, t.created_at, t.updated_at
                FROM tasks t
                LEFT JOIN task_categories tc ON t.category_id = tc.id
                WHERE 1=1
            '''
            args = []

            if responsible:
                sql += ' AND t.responsible = %s'
                args.append(responsible)
            if category_id:
                sql += ' AND t.category_id = %s'
                args.append(int(category_id))
            if status:
                sql += ' AND t.status = %s'
                args.append(status)

            sql += '''
                ORDER BY
                    CASE t.status WHEN 'pending' THEN 0 WHEN 'in_progress' THEN 1 WHEN 'done' THEN 2 ELSE 3 END,
                    t.created_at DESC
            '''

            cur.execute(sql, args)
            tasks = []
            for r in cur.fetchall():
                tasks.append({
                    'id': r[0],
                    'text': r[1],
                    'responsible': r[2],
                    'category_id': r[3],
                    'category_name': r[4],
                    'status': r[5],
                    'created_at': r[6].isoformat() if r[6] else None,
                    'updated_at': r[7].isoformat() if r[7] else None
                })

            return _ok({'tasks': tasks})

        elif method == 'POST':
            body = json.loads(event.get('body') or '{}')
            action = body.get('action', 'create_task')

            if action == 'create_category':
                name = body.get('name', '').strip()
                if not name:
                    return _err(400, 'name required')
                cur.execute(
                    'INSERT INTO task_categories (name) VALUES (%s) ON CONFLICT (name) DO UPDATE SET name=EXCLUDED.name RETURNING id, name',
                    (name,)
                )
                row = cur.fetchone()
                conn.commit()
                return _ok({'category': {'id': row[0], 'name': row[1]}})

            # create_task
            text = body.get('text', '').strip()
            responsible = body.get('responsible', '').strip()
            category_id = body.get('category_id')

            if not text or not responsible:
                return _err(400, 'text and responsible required')

            cur.execute(
                'INSERT INTO tasks (text, responsible, category_id, status) VALUES (%s, %s, %s, %s) RETURNING id, created_at',
                (text, responsible, category_id, 'pending')
            )
            row = cur.fetchone()
            conn.commit()
            return _ok({'id': row[0], 'created_at': row[1].isoformat()})

        elif method == 'PUT':
            body = json.loads(event.get('body') or '{}')
            task_id = body.get('id')
            status = body.get('status')

            if not task_id or status not in ('done', 'in_progress', 'pending'):
                return _err(400, 'id and valid status required')

            cur.execute(
                'UPDATE tasks SET status=%s, updated_at=CURRENT_TIMESTAMP WHERE id=%s',
                (status, task_id)
            )
            conn.commit()
            return _ok({'updated': True})

        else:
            return _err(405, 'Method not allowed')

    finally:
        cur.close()
        conn.close()


def _ok(data):
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(data, ensure_ascii=False)
    }

def _err(code, msg):
    return {
        'statusCode': code,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': msg}, ensure_ascii=False)
    }
