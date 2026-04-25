import json
import os
import psycopg2
from typing import Dict, Any

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p24058207_website_creation_pro')

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Сохранение FCM токена пользователя для получения push-уведомлений"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-User-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    method = event.get('httpMethod', 'POST')

    if not user_id:
        return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Unauthorized'})}

    body = json.loads(event.get('body') or '{}')
    token = body.get('token', '').strip()

    if not token:
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'token required'})}

    conn = get_db()
    cur = conn.cursor()

    if method == 'DELETE':
        cur.execute(f"DELETE FROM {SCHEMA}.fcm_tokens WHERE user_id = %s AND token = %s", (user_id, token))
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'ok': True})}

    device_info = body.get('device_info', '')
    cur.execute(f"""
        INSERT INTO {SCHEMA}.fcm_tokens (user_id, token, device_info, updated_at)
        VALUES (%s, %s, %s, NOW())
        ON CONFLICT (user_id, token) DO UPDATE SET updated_at = NOW(), device_info = EXCLUDED.device_info
    """, (user_id, token, device_info))
    conn.commit()
    cur.close()
    conn.close()

    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'ok': True})}
