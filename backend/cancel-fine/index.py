import json
import os
import psycopg2
from typing import Dict, Any

SCHEMA = 't_p24058207_website_creation_pro'
ADMIN_PASSWORD = '955660'

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Отмена штрафа промоутера администратором. POST с паролем."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    method = event.get('httpMethod', 'POST')
    body = json.loads(event.get('body') or '{}')

    password = body.get('password', '')
    if password != ADMIN_PASSWORD:
        return {'statusCode': 403, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Неверный пароль'})}

    user_id = body.get('user_id')
    fine_date = body.get('fine_date')
    fine_type = body.get('fine_type')
    fine_slot = body.get('fine_slot', '')
    amount = body.get('amount', 0)

    if not all([user_id, fine_date, fine_type]):
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'user_id, fine_date, fine_type required'})}

    conn = get_db()
    cur = conn.cursor()

    if method == 'DELETE':
        cur.execute(
            f"DELETE FROM {SCHEMA}.cancelled_fines WHERE user_id = %s AND fine_date = %s AND fine_type = %s AND fine_slot = %s",
            (user_id, fine_date, fine_type, fine_slot)
        )
        conn.commit()
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'ok': True, 'action': 'restored'})}

    cur.execute(
        f"""INSERT INTO {SCHEMA}.cancelled_fines (user_id, fine_date, fine_type, fine_slot, amount)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (user_id, fine_date, fine_type, fine_slot) DO NOTHING""",
        (user_id, fine_date, fine_type, fine_slot, amount)
    )
    conn.commit()
    cur.close()
    conn.close()

    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'ok': True, 'action': 'cancelled'})}
