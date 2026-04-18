import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление задачами: CRUD для задач, категорий и действий.
    GET /  — список задач
    GET /?action=categories — список категорий
    GET /?action=actions&task_id=X — действия по задаче
    POST / action=create_task|create_category|create_action
    PUT / — обновить статус задачи или действия (action_id)
    DELETE /?id=X — удалить задачу
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

            if action == 'actions':
                task_id = params.get('task_id')
                if not task_id:
                    return _err(400, 'task_id required')
                cur.execute(
                    'SELECT id, comment, is_done, done_at, created_at FROM task_actions WHERE task_id=%s ORDER BY created_at ASC',
                    (int(task_id),)
                )
                actions = [{
                    'id': r[0], 'comment': r[1], 'is_done': r[2],
                    'done_at': r[3].isoformat() if r[3] else None,
                    'created_at': r[4].isoformat() if r[4] else None
                } for r in cur.fetchall()]
                return _ok({'actions': actions})

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

            if action == 'create_action':
                task_id = body.get('task_id')
                comment = body.get('comment', '').strip()
                if not task_id or not comment:
                    return _err(400, 'task_id and comment required')
                cur.execute(
                    'INSERT INTO task_actions (task_id, comment) VALUES (%s, %s) RETURNING id, created_at',
                    (task_id, comment)
                )
                row = cur.fetchone()
                conn.commit()
                return _ok({'id': row[0], 'created_at': row[1].isoformat()})

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

            # Обновление действия (чекбокс)
            if body.get('action_id'):
                action_id = body['action_id']
                is_done = body.get('is_done', False)
                done_at = 'CURRENT_TIMESTAMP' if is_done else 'NULL'
                cur.execute(
                    f'UPDATE task_actions SET is_done=%s, done_at={done_at} WHERE id=%s',
                    (is_done, action_id)
                )
                conn.commit()
                return _ok({'updated': True})

            # Обновление статуса задачи
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

        elif method == 'DELETE':
            params = event.get('queryStringParameters') or {}
            task_id = params.get('id')
            if not task_id:
                return _err(400, 'id required')
            cur.execute('DELETE FROM tasks WHERE id=%s', (int(task_id),))
            conn.commit()
            return _ok({'deleted': True})

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