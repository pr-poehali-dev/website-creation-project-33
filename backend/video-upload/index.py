import json
import os
import uuid
import base64
import boto3
from botocore.config import Config
from datetime import datetime

def handler(event: dict, context) -> dict:
    """
    Чанковая загрузка видео в S3.
    chunk_data + chunk_index + total_chunks — загружает чанк, на последнем собирает файл.
    save_meta=true — сохраняет JSON метаданных лида.
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

    # Режим: загрузка чанка
    if 'chunk_data' in body:
        chunk_b64 = body['chunk_data']
        chunk_index = int(body.get('chunk_index', 0))
        total_chunks = int(body.get('total_chunks', 1))
        upload_id = body.get('upload_id', str(uuid.uuid4()))
        mime_type = body.get('mimeType', 'video/webm')
        ext = 'mp4' if 'mp4' in mime_type else 'webm'

        chunk_bytes = base64.b64decode(chunk_b64)
        chunk_key = f'video-leads/tmp/{upload_id}/chunk_{chunk_index:04d}'
        s3.put_object(Bucket='files', Key=chunk_key, Body=chunk_bytes)

        # Последний чанк — собираем файл
        if chunk_index == total_chunks - 1:
            timestamp = datetime.utcnow().strftime('%Y-%m-%d_%H-%M-%S')
            video_key = f'video-leads/{timestamp}_{upload_id}.{ext}'
            meta_key = f'video-leads/{timestamp}_{upload_id}.json'

            all_bytes = b''
            for i in range(total_chunks):
                ck = f'video-leads/tmp/{upload_id}/chunk_{i:04d}'
                obj = s3.get_object(Bucket='files', Key=ck)
                all_bytes += obj['Body'].read()
                s3.delete_object(Bucket='files', Key=ck)

            s3.put_object(Bucket='files', Key=video_key, Body=all_bytes, ContentType=mime_type)
            print(f"[INFO] Assembled {total_chunks} chunks, total {len(all_bytes)} bytes -> {video_key}")

            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'done': True, 'video_key': video_key, 'meta_key': meta_key})
            }

        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'done': False, 'chunk_index': chunk_index, 'upload_id': upload_id})
        }

    # Режим: сохранить метаданные
    if body.get('save_meta'):
        meta_key = body.get('meta_key', '')
        meta = {
            'timestamp': datetime.utcnow().isoformat(),
            'parentName': body.get('parentName', ''),
            'childName': body.get('childName', ''),
            'childAge': body.get('childAge', ''),
            'phone': body.get('phone', ''),
            'userId': user_id,
            'videoKey': body.get('video_key', ''),
            'mimeType': body.get('mimeType', '')
        }
        s3.put_object(
            Bucket='files', Key=meta_key,
            Body=json.dumps(meta, ensure_ascii=False).encode('utf-8'),
            ContentType='application/json'
        )
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'success': True})
        }

    return {
        'statusCode': 400,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'error': 'unknown mode'})
    }
