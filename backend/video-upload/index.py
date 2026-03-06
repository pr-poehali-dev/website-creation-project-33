import json
import os
import uuid
import base64
import boto3
from botocore.config import Config
from datetime import datetime

def handler(event: dict, context) -> dict:
    """Принимает видео как base64 + данные анкеты, сохраняет в S3"""

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
    video_b64 = body.get('video', '')
    mime_type = body.get('mimeType', 'video/webm')
    parent_name = body.get('parentName', '').strip()
    child_name = body.get('childName', '').strip()
    child_age = body.get('childAge', '').strip()
    phone = body.get('phone', '').strip()
    user_id = event.get('headers', {}).get('X-User-Id', '')

    if not video_b64:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'video data missing'})
        }

    # Очищаем base64
    marker = ';base64,'
    idx = video_b64.find(marker)
    if idx != -1:
        video_b64 = video_b64[idx + len(marker):]
    video_b64 = video_b64.strip().replace('\n', '').replace('\r', '').replace(' ', '')
    video_b64 = video_b64.replace('-', '+').replace('_', '/')
    missing = len(video_b64) % 4
    if missing:
        video_b64 += '=' * (4 - missing)

    video_bytes = base64.b64decode(video_b64)
    print(f"[INFO] Video size: {len(video_bytes)} bytes, mime: {mime_type}")

    ext = 'mp4' if 'mp4' in mime_type else 'webm'
    lead_id = str(uuid.uuid4())
    timestamp = datetime.utcnow().strftime('%Y-%m-%d_%H-%M-%S')
    video_key = f'video-leads/{timestamp}_{lead_id}.{ext}'
    meta_key = f'video-leads/{timestamp}_{lead_id}.json'

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        config=Config(signature_version='s3v4')
    )

    # Сохраняем видео
    s3.put_object(
        Bucket='files',
        Key=video_key,
        Body=video_bytes,
        ContentType=mime_type
    )

    # Сохраняем данные анкеты рядом с видео
    meta = {
        'lead_id': lead_id,
        'timestamp': timestamp,
        'parentName': parent_name,
        'childName': child_name,
        'childAge': child_age,
        'phone': phone,
        'userId': user_id,
        'videoKey': video_key,
        'mimeType': mime_type
    }
    s3.put_object(
        Bucket='files',
        Key=meta_key,
        Body=json.dumps(meta, ensure_ascii=False).encode('utf-8'),
        ContentType='application/json'
    )

    cdn_base = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket"

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            's3_key': video_key,
            'video_url': f"{cdn_base}/{video_key}",
            'meta_url': f"{cdn_base}/{meta_key}"
        })
    }
