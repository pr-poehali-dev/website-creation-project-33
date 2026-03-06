import json
import os
import boto3
import requests
from botocore.config import Config

TELEGRAM_TOKEN = "8081347931:AAGTto62t8bmIIzdDZu5wYip0QP95JJxvIc"
USER_ID = "5215501225"

def handler(event: dict, context) -> dict:
    """Скачивает видео из S3 и отправляет видео-лид в Telegram"""

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

    body = json.loads(event.get('body', '{}'))

    s3_key = body.get('s3_key', '').strip()
    parent_name = body.get('parentName', '').strip()
    child_name = body.get('childName', '').strip()
    child_age = body.get('childAge', '').strip()
    phone = body.get('phone', '').strip()
    mime_type = body.get('mimeType', 'video/webm')
    user_id_header = event.get('headers', {}).get('X-User-Id', '')

    if not s3_key:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 's3_key missing'})
        }

    # Скачиваем видео из S3
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        config=Config(signature_version='s3v4')
    )

    s3_response = s3.get_object(Bucket='files', Key=s3_key)
    video_bytes = s3_response['Body'].read()

    caption = (
        f"🎥 Новый видео-лид\n\n"
        f"👤 Родитель: {parent_name}\n"
        f"👶 Ребёнок: {child_name}\n"
        f"🎂 Возраст: {child_age}\n"
        f"📱 Телефон: {phone}"
    )
    if user_id_header:
        caption += f"\n\n🆔 Сотрудник ID: {user_id_header}"

    ext = 'mp4' if 'mp4' in mime_type else 'webm'
    filename = f'lead.{ext}'

    # Пробуем sendVideo, при ошибке — sendDocument
    tg_response = requests.post(
        f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendVideo",
        data={'chat_id': USER_ID, 'caption': caption},
        files={'video': (filename, video_bytes, mime_type)},
        timeout=120
    )

    if tg_response.status_code != 200:
        tg_response = requests.post(
            f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendDocument",
            data={'chat_id': USER_ID, 'caption': caption},
            files={'document': (filename, video_bytes, mime_type)},
            timeout=120
        )

    # Удаляем файл из S3 после отправки
    s3.delete_object(Bucket='files', Key=s3_key)

    if tg_response.status_code == 200:
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'success': True})
        }
    else:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': tg_response.text})
        }
