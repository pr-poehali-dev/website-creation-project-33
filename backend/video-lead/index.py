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

    video_bytes = base64.b64decode(video_base64)

    caption = (
        f"🎥 *Новый видео-лид*\n\n"
        f"👤 Родитель: {parent_name}\n"
        f"👶 Ребёнок: {child_name}\n"
        f"🎂 Возраст: {child_age}\n"
        f"📱 Телефон: {phone}"
    )
    if user_id_header:
        caption += f"\n\n🆔 Сотрудник ID: {user_id_header}"

    api_url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendVideo"
    response = requests.post(
        api_url,
        data={
            'chat_id': USER_ID,
            'caption': caption,
            'parse_mode': 'Markdown'
        },
        files={
            'video': ('lead.mp4', video_bytes, 'video/mp4')
        },
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
