import json
import os
import uuid
import boto3
from botocore.config import Config
from datetime import datetime

def handler(event: dict, context) -> dict:
    """
    Режим 1 (get_presigned=true): возвращает presigned PUT URL для прямой загрузки видео в S3.
    Режим 2 (save_meta=true): сохраняет JSON метаданных лида в S3.
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

    body = json.loads(event.get('body', '{}'))
    user_id = event.get('headers', {}).get('X-User-Id', '')

    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
        config=Config(signature_version='s3v4')
    )

    # Режим 1: получить presigned URL для прямой загрузки видео
    if body.get('get_presigned'):
        mime_type = body.get('mimeType', 'video/webm')
        ext = 'mp4' if 'mp4' in mime_type else 'webm'
        timestamp = datetime.utcnow().strftime('%Y-%m-%d_%H-%M-%S')
        lead_id = str(uuid.uuid4())
        video_key = f'video-leads/{timestamp}_{lead_id}.{ext}'
        meta_key = f'video-leads/{timestamp}_{lead_id}.json'

        upload_url = s3.generate_presigned_url(
            'put_object',
            Params={'Bucket': 'files', 'Key': video_key, 'ContentType': mime_type},
            ExpiresIn=600
        )

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'upload_url': upload_url, 'video_key': video_key, 'meta_key': meta_key})
        }

    # Режим 2: сохранить метаданные лида
    if body.get('save_meta'):
        meta_key = body.get('meta_key', '')
        if not meta_key:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'meta_key missing'})
            }

        meta = {
            'timestamp': body.get('timestamp', ''),
            'parentName': body.get('parentName', ''),
            'childName': body.get('childName', ''),
            'childAge': body.get('childAge', ''),
            'phone': body.get('phone', ''),
            'userId': user_id,
            'videoKey': body.get('video_key', ''),
            'mimeType': body.get('mimeType', '')
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
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({
                'success': True,
                'video_url': f"{cdn_base}/{body.get('video_key', '')}",
                'meta_url': f"{cdn_base}/{meta_key}"
            })
        }

    return {
        'statusCode': 400,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'error': 'unknown mode'})
    }
