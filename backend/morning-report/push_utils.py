"""Утилита отправки push-уведомлений администраторам через FCM HTTP v1 API"""
import json
import os
import time
import requests
import jwt

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p24058207_website_creation_pro')
FCM_SCOPE = 'https://www.googleapis.com/auth/firebase.messaging'


def _get_access_token(sa: dict) -> str:
    now = int(time.time())
    payload = {
        'iss': sa['client_email'], 'sub': sa['client_email'],
        'aud': sa['token_uri'], 'iat': now, 'exp': now + 3600,
        'scope': FCM_SCOPE,
    }
    signed_jwt = jwt.encode(payload, sa['private_key'], algorithm='RS256')
    resp = requests.post(sa['token_uri'], data={
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'assertion': signed_jwt,
    }, timeout=10)
    resp.raise_for_status()
    return resp.json()['access_token']


def notify_admins(conn, title: str, body: str) -> int:
    """Отправить push всем администраторам. conn — открытое psycopg2-соединение."""
    try:
        raw = os.environ.get('FIREBASE_SERVICE_ACCOUNT_JSON', '')
        if not raw:
            return 0
        sa = json.loads(raw)
        if not isinstance(sa, dict):
            return 0

        cur = conn.cursor()
        cur.execute(f"""
            SELECT ft.token FROM {SCHEMA}.fcm_tokens ft
            JOIN {SCHEMA}.users u ON ft.user_id = u.id
            WHERE u.is_admin = true
        """)
        tokens = [r[0] for r in cur.fetchall()]
        cur.close()
        if not tokens:
            return 0

        access_token = _get_access_token(sa)
        project_id = sa.get('project_id', 'imperia-promo')
        url = f'https://fcm.googleapis.com/v1/projects/{project_id}/messages:send'
        headers = {'Authorization': f'Bearer {access_token}', 'Content-Type': 'application/json'}

        sent = 0
        stale_tokens = []
        for token in tokens:
            resp = requests.post(url, headers=headers, json={
                'message': {
                    'token': token,
                    'notification': {'title': title, 'body': body},
                    'data': {'title': title, 'body': body},
                    'apns': {
                        'headers': {'apns-priority': '10', 'apns-push-type': 'alert'},
                        'payload': {
                            'aps': {
                                'alert': {'title': title, 'body': body},
                                'sound': 'default',
                                'badge': 1,
                                'content-available': 1,
                            }
                        }
                    },
                    'android': {
                        'priority': 'high',
                        'notification': {'title': title, 'body': body, 'sound': 'default'}
                    },
                    'webpush': {
                        'headers': {'Urgency': 'high'},
                        'notification': {'title': title, 'body': body}
                    }
                }
            }, timeout=10)
            if resp.status_code == 200:
                sent += 1
            elif resp.status_code == 404:
                stale_tokens.append(token)
                print(f'[notify_admins] stale token removed: {token[:20]}...')
            else:
                print(f'[notify_admins] failed token={token[:20]}... status={resp.status_code} resp={resp.text[:200]}')
        if stale_tokens:
            cur2 = conn.cursor()
            for t in stale_tokens:
                cur2.execute(f"DELETE FROM {SCHEMA}.fcm_tokens WHERE token = %s", (t,))
            conn.commit()
            cur2.close()
        return sent
    except Exception as e:
        print(f'[notify_admins] error: {e}')
        return 0