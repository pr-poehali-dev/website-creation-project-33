import json
import os
import psycopg2
import requests
import time
import jwt
from typing import Dict, Any, List, Optional

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p24058207_website_creation_pro')
FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'

def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def get_access_token() -> str:
    """Получить OAuth2 access token для FCM v1 API через JWT"""
    sa_json = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON', '')
    if not sa_json:
        raise Exception('FIREBASE_SERVICE_ACCOUNT_JSON secret not set')

    sa = json.loads(sa_json)
    now = int(time.time())

    payload = {
        'iss': sa['client_email'],
        'sub': sa['client_email'],
        'aud': sa['token_uri'],
        'iat': now,
        'exp': now + 3600,
        'scope': FCM_SCOPE,
    }

    signed_jwt = jwt.encode(payload, sa['private_key'], algorithm='RS256')
    resp = requests.post(sa['token_uri'], data={
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': signed_jwt,
    })
    resp.raise_for_status()
    return resp.json()['access_token']

def send_to_token(access_token: str, project_id: str, fcm_token: str, title: str, body: str, data: Optional[dict] = None) -> bool:
    """Отправить уведомление на конкретный FCM токен"""
    url = f'https://fcm.googleapis.com/v1/projects/{project_id}/messages:send'
    message = {
        'token': fcm_token,
        'notification': {'title': title, 'body': body},
    }
    if data:
        message['data'] = {k: str(v) for k, v in data.items()}

    resp = requests.post(url, headers={
        'Authorization': f'Bearer {access_token}',
        'Content-Type': 'application/json',
    }, json={'message': message})

    if resp.status_code == 404 or resp.status_code == 410:
        return False
    return resp.status_code == 200

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Отправка push-уведомлений пользователям. Только для администраторов.
    POST body: { title, body, user_ids?: int[], data?: object }
    Если user_ids не передан — отправляет всем."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-User-Id', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')

    if not user_id:
        return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Unauthorized'})}

    conn = get_db()
    cur = conn.cursor()

    cur.execute(f"SELECT is_admin FROM {SCHEMA}.users WHERE id = %s", (user_id,))
    row = cur.fetchone()
    if not row or not row[0]:
        cur.close()
        conn.close()
        return {'statusCode': 403, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'Forbidden'})}

    body_data = json.loads(event.get('body') or '{}')
    title = body_data.get('title', '').strip()
    body_text = body_data.get('body', '').strip()
    target_user_ids: Optional[List[int]] = body_data.get('user_ids')
    extra_data = body_data.get('data')

    if not title or not body_text:
        cur.close()
        conn.close()
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'title and body required'})}

    if target_user_ids:
        cur.execute(f"SELECT token FROM {SCHEMA}.fcm_tokens WHERE user_id = ANY(%s)", (target_user_ids,))
    else:
        cur.execute(f"SELECT token FROM {SCHEMA}.fcm_tokens")

    tokens = [r[0] for r in cur.fetchall()]
    cur.close()
    conn.close()

    if not tokens:
        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'ok': True, 'sent': 0, 'total': 0})}

    sa_json = json.loads(os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON', '{}'))
    project_id = sa_json.get('project_id', 'imperia-promo')

    access_token = get_access_token()

    sent = 0
    for token in tokens:
        if send_to_token(access_token, project_id, token, title, body_text, extra_data):
            sent += 1

    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'ok': True, 'sent': sent, 'total': len(tokens)})}
