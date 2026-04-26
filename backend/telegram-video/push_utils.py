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
        for token in tokens:
            resp = requests.post(url, headers=headers, json={
                'message': {'token': token, 'data': {'title': title, 'body': body}}
            }, timeout=10)
            if resp.status_code == 200:
                sent += 1
        return sent
    except Exception as e:
        print(f'[notify_admins] error: {e}')
        return 0