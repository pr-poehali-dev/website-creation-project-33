import json
import os
import uuid
import base64
import boto3
from botocore.config import Config

def handler(event: dict, context) -> dict:
    """Принимает видео как base64, сохраняет в S3, возвращает s3_key"""

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
    key = f'video-leads/{uuid.uuid4()}.{ext}'

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        config=Config(signature_version='s3v4')
    )

    s3.put_object(
        Bucket='files',
        Key=key,
        Body=video_bytes,
        ContentType=mime_type
    )

    return {
        'statusCode': 200,
        'headers': {
            'Access-Control-Allow-Origin': '*',
            'Content-Type': 'application/json'
        },
        'body': json.dumps({'s3_key': key})
    }
