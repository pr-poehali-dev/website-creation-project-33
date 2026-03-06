import json
import base64
import requests
import os

TELEGRAM_TOKEN = "8081347931:AAGTto62t8bmIIzdDZu5wYip0QP95JJxvIc"
USER_ID = "5215501225"

def handler(event: dict, context) -> dict:
    """Отправляет видео-лид в Telegram с данными анкеты"""

    if event.get('httpMethod') == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': ''
        }

    body = json.loads(event.get('body', '{}'))

    video_base64 = body.get('video')
    parent_name = body.get('parentName', '').strip()
    child_name = body.get('childName', '').strip()
    child_age = body.get('childAge', '').strip()
    phone = body.get('phone', '').strip()
    user_id_header = event.get('headers', {}).get('X-User-Id', '')

    if not video_base64:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Video data missing'})
        }

    # Фикс паддинга base64
    missing_padding = len(video_base64) % 4
    if missing_padding:
        video_base64 += '=' * (4 - missing_padding)
    video_bytes = base64.b64decode(video_base64)
    mime_type = body.get('mimeType', 'video/webm')

    # Telegram лучше принимает через sendDocument если формат не mp4
    caption = (
        f"🎥 Новый видео-лид\n\n"
        f"👤 Родитель: {parent_name}\n"
        f"👶 Ребёнок: {child_name}\n"
        f"🎂 Возраст: {child_age}\n"
        f"📱 Телефон: {phone}"
    )
    if user_id_header:
        caption += f"\n\n🆔 Сотрудник ID: {user_id_header}"

    # Пробуем sendVideo, при ошибке — sendDocument
    ext = 'mp4' if 'mp4' in mime_type else 'webm'
    filename = f'lead.{ext}'

    api_url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendVideo"
    response = requests.post(
        api_url,
        data={'chat_id': USER_ID, 'caption': caption},
        files={'video': (filename, video_bytes, mime_type)},
        timeout=60
    )

    if response.status_code != 200:
        # Fallback — отправляем как документ
        api_url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendDocument"
        response = requests.post(
            api_url,
            data={'chat_id': USER_ID, 'caption': caption},
            files={'document': (filename, video_bytes, mime_type)},
            timeout=60
        )

    if response.status_code == 200:
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'success': True})
        }
    else:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': response.text})
        }