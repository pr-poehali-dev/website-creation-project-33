"""
Утилита для отправки push-уведомлений администраторам через FCM HTTP v1 API.
Вызывается из других бэкенд-функций напрямую (не через HTTP).
"""

import json
import os
import time
import requests
import jwt
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p24058207_website_creation_pro')
FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'


def get_fcm_access_token() -> str:
    raw = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON', '')
    if not raw:
        raise Exception('FIREBASE_SERVICE_ACCOUNT_JSON not set')
    sa = json.loads(raw)
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
    }, timeout=10)
    resp.raise_for_status()
    return resp.json()['access_token']


def get_admin_tokens(conn) -> list:
    """Получить FCM токены всех администраторов"""
    cur = conn.cursor()
    cur.execute(f"""
        SELECT ft.token FROM {SCHEMA}.fcm_tokens ft
        JOIN {SCHEMA}.users u ON ft.user_id = u.id
        WHERE u.is_admin = true
    """)
    tokens = [r[0] for r in cur.fetchall()]
    cur.close()
    return tokens


def send_push_to_admins(conn, title: str, body: str, data: dict = None) -> int:
    """
    Отправить push-уведомление всем администраторам.
    conn — уже открытое psycopg2-соединение.
    Возвращает количество успешно отправленных уведомлений.
    """
    try:
        tokens = get_admin_tokens(conn)
        if not tokens:
            return 0

        raw = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON', '')
        if not raw:
            return 0
        sa = json.loads(raw)
        project_id = sa.get('project_id', 'imperia-promo')

        access_token = get_fcm_access_token()
        url = f'https://fcm.googleapis.com/v1/projects/{project_id}/messages:send'
        headers = {'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'}

        sent = 0
        for token in tokens:
            message = {
                'token': token,
                'notification': {'title': title, 'body': body},
            }
            if data:
                message['data'] = {k: str(v) for k, v in data.items()}
            resp = requests.post(url, headers=headers, json={'message': message}, timeout=10)
            if resp.status_code == 200:
                sent += 1
        return sent
    except Exception as e:
        print(f'[push-notify] error: {e}')
        return 0


def handler(event: dict, context) -> dict:
    """HTTP-обёртка для ручной отправки (тест)"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'}, 'body': ''}

    body = json.loads(event.get('body') or '{}')
    title = body.get('title', 'Тест')
    msg = body.get('body', '')

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    sent = send_push_to_admins(conn, title, msg)
    conn.close()

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'ok': True, 'sent': sent}),
    }
