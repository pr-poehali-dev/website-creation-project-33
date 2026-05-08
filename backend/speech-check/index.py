import json
import os
import requests
import psycopg2
from datetime import datetime
import pytz

MOSCOW_TZ = pytz.timezone('Europe/Moscow')

def get_user_name(user_id: int, database_url: str) -> str:
    """Получить имя промоутера из БД по user_id"""
    try:
        with psycopg2.connect(database_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    "SELECT name FROM t_p24058207_website_creation_pro.users WHERE id = %s",
                    (user_id,)
                )
                result = cur.fetchone()
                return result[0] if result else 'Неизвестный промоутер'
    except Exception as e:
        print(f'DB error getting user name: {e}')
        return 'Неизвестный промоутер'

def handler(event: dict, context) -> dict:
    """
    Принимает сигнал от промоутера о том, что он произнёс слово 'Здравствуйте',
    и отправляет уведомление в Telegram бот по user_id промоутера.
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    if event.get('httpMethod') != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }

    user_id = event.get('headers', {}).get('X-User-Id')
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'X-User-Id header required'})
        }

    bot_token = '8081347931:AAGTto62t8bmIIzdDZu5wYip0QP95JJxvIc'
    chat_ids = ['5215501225', '1526249125']
    database_url = os.environ.get('DATABASE_URL', '')

    body_data = json.loads(event.get('body', '{}'))
    success = body_data.get('success', True)
    heard = body_data.get('heard', '').strip()
    timeout = body_data.get('timeout', False)

    user_name = get_user_name(int(user_id), database_url) if database_url else 'Промоутер'

    moscow_time = datetime.now(MOSCOW_TZ).strftime('%d.%m.%Y %H:%M:%S')

    if success and not timeout:
        text = (
            f'✅ <b>Промоутер поздоровался!</b>\n\n'
            f'👤 <b>{user_name}</b>\n'
            f'📝 Произнёс: <b>«Здравствуйте»</b>\n'
            f'🕐 Время: {moscow_time}'
        )
    elif timeout:
        heard_text = f'«{heard}»' if heard else '(тишина)'
        text = (
            f'⏱ <b>Триггер не сработал — переход по таймеру</b>\n\n'
            f'👤 <b>{user_name}</b>\n'
            f'📝 Было сказано: <b>{heard_text}</b>\n'
            f'🕐 Время: {moscow_time}'
        )
    else:
        heard_text = f'«{heard}»' if heard else '(не распознано)'
        text = (
            f'❌ <b>Промоутер не поздоровался!</b>\n\n'
            f'👤 <b>{user_name}</b>\n'
            f'📝 Сказал: <b>{heard_text}</b>\n'
            f'🕐 Время: {moscow_time}'
        )

    tg_ok = False
    for chat_id in chat_ids:
        try:
            response = requests.post(
                f'https://api.telegram.org/bot{bot_token}/sendMessage',
                json={'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'},
                timeout=10
            )
            if response.ok:
                tg_ok = True
            else:
                print(f'Telegram error chat_id={chat_id}: {response.text}')
        except Exception as e:
            print(f'Telegram send error chat_id={chat_id}: {e}')

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': True,
            'telegram_sent': tg_ok,
            'user_name': user_name
        })
    }