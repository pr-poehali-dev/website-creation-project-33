import json
import os
import base64
import requests
import psycopg2
from datetime import datetime
import pytz

MOSCOW_TZ = pytz.timezone('Europe/Moscow')
BOT_TOKEN = '8081347931:AAGTto62t8bmIIzdDZu5wYip0QP95JJxvIc'
CHAT_IDS = ['5215501225', '1526249125']
TARGET_WORD = 'здравствуйте'


def get_user_name(user_id: int, database_url: str) -> str:
    """Получить имя промоутера из БД"""
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
        print(f'DB error: {e}')
        return 'Неизвестный промоутер'


def transcribe_audio(audio_b64: str, mime_type: str) -> str:
    """Отправить аудио в Groq Whisper и получить текст"""
    groq_key = os.environ.get('GROQ_API_KEY', '')
    if not groq_key:
        raise ValueError('GROQ_API_KEY not set')

    audio_bytes = base64.b64decode(audio_b64)

    ext_map = {
        'audio/webm': 'audio.webm',
        'audio/webm;codecs=opus': 'audio.webm',
        'audio/ogg': 'audio.ogg',
        'audio/ogg;codecs=opus': 'audio.ogg',
        'audio/mp4': 'audio.mp4',
        'audio/mpeg': 'audio.mp3',
        'audio/wav': 'audio.wav',
    }
    filename = ext_map.get(mime_type.lower(), 'audio.webm')

    response = requests.post(
        'https://api.groq.com/openai/v1/audio/transcriptions',
        headers={'Authorization': f'Bearer {groq_key}'},
        files={'file': (filename, audio_bytes, mime_type)},
        data={'model': 'whisper-large-v3', 'language': 'ru', 'response_format': 'json'},
        timeout=30
    )

    if not response.ok:
        raise ValueError(f'Groq error: {response.text}')

    return response.json().get('text', '').strip()


def send_telegram_notification(user_name: str, success: bool, heard: str, moscow_time: str):
    """Отправить уведомление администраторам"""
    if success:
        text = (
            f'🗣 <b>Промоутер поздоровался!</b>\n\n'
            f'👤 <b>{user_name}</b>\n'
            f'📝 Произнёс: <b>«Здравствуйте»</b>\n'
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

    for chat_id in CHAT_IDS:
        try:
            resp = requests.post(
                f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage',
                json={'chat_id': chat_id, 'text': text, 'parse_mode': 'HTML'},
                timeout=10
            )
            if not resp.ok:
                print(f'Telegram error chat_id={chat_id}: {resp.text}')
        except Exception as e:
            print(f'Telegram send error: {e}')


def handler(event: dict, context) -> dict:
    """
    Принимает аудио от промоутера (base64), распознаёт через Groq Whisper,
    проверяет слово 'здравствуйте' и отправляет уведомление администраторам в Telegram.
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

    body_data = json.loads(event.get('body', '{}'))
    audio_b64 = body_data.get('audio')
    mime_type = body_data.get('mime_type', 'audio/webm')

    if not audio_b64:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'audio required'})
        }

    database_url = os.environ.get('DATABASE_URL', '')
    user_name = get_user_name(int(user_id), database_url) if database_url else 'Промоутер'
    moscow_time = datetime.now(MOSCOW_TZ).strftime('%d.%m.%Y %H:%M:%S')

    try:
        transcript = transcribe_audio(audio_b64, mime_type)
        print(f'Transcribed: "{transcript}"')
        success = TARGET_WORD in transcript.lower()
    except Exception as e:
        print(f'Transcription error: {e}')
        transcript = ''
        success = False

    send_telegram_notification(user_name, success, transcript, moscow_time)

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'success': success,
            'transcript': transcript,
            'user_name': user_name
        })
    }
