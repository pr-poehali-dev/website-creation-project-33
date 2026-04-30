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
    """Получить FCM токены всех администраторов (все устройства)"""
    cur = conn.cursor()
    cur.execute(f"""
        SELECT ft.token, ft.device_info FROM {SCHEMA}.fcm_tokens ft
        JOIN {SCHEMA}.users u ON ft.user_id = u.id
        WHERE u.is_admin = true
    """)
    rows = [{'token': r[0], 'device_info': r[1] or ''} for r in cur.fetchall()]
    cur.close()
    return rows


def remove_invalid_token(conn, token: str):
    """Удалить невалидный токен из БД"""
    try:
        cur = conn.cursor()
        cur.execute(f"DELETE FROM {SCHEMA}.fcm_tokens WHERE token = %s", (token,))
        conn.commit()
        cur.close()
    except Exception:
        pass


def is_ios_device(device_info: str) -> bool:
    d = device_info.lower()
    return 'iphone' in d or 'ipad' in d or 'ios' in d or 'mac os x' in d


def send_push_to_admins(conn, title: str, body: str, data: dict = None) -> int:
    """
    Отправить push-уведомление всем администраторам на все устройства.
    conn — уже открытое psycopg2-соединение.
    Возвращает количество успешно отправленных уведомлений.
    """
    try:
        token_rows = get_admin_tokens(conn)
        if not token_rows:
            print('[push-notify] no admin tokens found')
            return 0

        raw = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON', '')
        if not raw:
            print('[push-notify] FIREBASE_SERVICE_ACCOUNT_JSON not set')
            return 0
        sa = json.loads(raw)
        project_id = sa.get('project_id', 'imperia-promo')

        access_token = get_fcm_access_token()
        url = f'https://fcm.googleapis.com/v1/projects/{project_id}/messages:send'
        headers = {'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'}

        sent = 0
        for row in token_rows:
            token = row['token']
            device_info = row['device_info']
            ios = is_ios_device(device_info)

            message = {
                'token': token,
                'notification': {'title': title, 'body': body},
                # Android настройки
                'android': {
                    'priority': 'high',
                    'notification': {
                        'title': title,
                        'body': body,
                        'sound': 'default',
                    }
                },
                # iOS (APNS) настройки — обязательно для доставки на iPhone
                'apns': {
                    'headers': {
                        'apns-priority': '10',
                        'apns-push-type': 'alert',
                    },
                    'payload': {
                        'aps': {
                            'alert': {'title': title, 'body': body},
                            'sound': 'default',
                            'badge': 1,
                            'content-available': 1,
                        }
                    }
                },
                # Web Push
                'webpush': {
                    'headers': {'Urgency': 'high'},
                    'notification': {'title': title, 'body': body}
                },
            }
            if data:
                message['data'] = {k: str(v) for k, v in data.items()}

            resp = requests.post(url, headers=headers, json={'message': message}, timeout=10)
            resp_json = {}
            try:
                resp_json = resp.json()
            except Exception:
                pass

            if resp.status_code == 200:
                sent += 1
                print(f'[push-notify] sent ok → {"iOS" if ios else "Android/Web"} {token[:20]}...')
            else:
                error_code = resp_json.get('error', {}).get('details', [{}])[0].get('errorCode', '')
                print(f'[push-notify] failed token {token[:20]}... status={resp.status_code} error={error_code} ios={ios}')
                # Удаляем невалидные токены
                if error_code in ('UNREGISTERED', 'INVALID_ARGUMENT') or resp.status_code == 404:
                    remove_invalid_token(conn, token)
                    print(f'[push-notify] removed invalid token {token[:20]}...')

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
