import json
import os
import boto3
import base64
import uuid
from datetime import datetime
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Загрузка медиафайлов чата в S3. Принимает base64, возвращает CDN URL."""
    cors = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {**cors, 'Access-Control-Max-Age': '86400'}, 'body': ''}

    headers_in = event.get('headers', {})
    user_id = headers_in.get('X-User-Id') or headers_in.get('x-user-id')
    if not user_id:
        return {'statusCode': 401, 'headers': {'Content-Type': 'application/json', **cors}, 'body': json.dumps({'error': 'Unauthorized'})}

    body_raw = event.get('body', '{}')
    if event.get('isBase64Encoded'):
        body_raw = base64.b64decode(body_raw).decode('utf-8')
    body = json.loads(body_raw)

    media_data = body.get('media_data')   # base64 string
    media_type = body.get('media_type')   # 'audio' | 'image' | 'video'
    mime = body.get('mime', '')           # e.g. 'audio/mp4', 'image/jpeg'

    if not media_data or not media_type:
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', **cors}, 'body': json.dumps({'error': 'media_data and media_type required'})}

    # Decode
    try:
        file_bytes = base64.b64decode(media_data)
    except Exception as e:
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', **cors}, 'body': json.dumps({'error': f'Invalid base64: {e}'})}

    # Determine mime + extension
    if not mime:
        raw4 = file_bytes[:4]
        if raw4[:3] == b'ID3' or raw4[:2] == b'\xff\xfb':
            mime = 'audio/mpeg'; ext = 'mp3'
        elif raw4 == b'OggS':
            mime = 'audio/ogg'; ext = 'ogg'
        elif raw4 == b'\x1a\x45\xdf\xa3':
            mime = 'audio/webm'; ext = 'webm'
        elif file_bytes[4:8] == b'ftyp' or raw4[:4] in (b'\x00\x00\x00\x18', b'\x00\x00\x00\x1c', b'\x00\x00\x00\x20'):
            mime = 'audio/mp4'; ext = 'mp4'
        elif media_type == 'audio':
            mime = 'audio/mp4'; ext = 'mp4'
        elif media_type == 'image':
            mime = 'image/jpeg'; ext = 'jpg'
        else:
            mime = 'video/mp4'; ext = 'mp4'
    else:
        if 'mp4' in mime or 'aac' in mime:
            ext = 'mp4'
        elif 'webm' in mime:
            ext = 'webm'
        elif 'ogg' in mime:
            ext = 'ogg'
        elif 'mpeg' in mime or 'mp3' in mime:
            ext = 'mp3'
        elif 'jpeg' in mime or 'jpg' in mime:
            ext = 'jpg'
        elif 'png' in mime:
            ext = 'png'
        else:
            ext = mime.split('/')[-1].split(';')[0]

    # Upload to S3
    key = f"chat/{media_type}/{user_id}/{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}_{uuid.uuid4().hex[:8]}.{ext}"
    s3 = boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    s3.put_object(Bucket='files', Key=key, Body=file_bytes, ContentType=mime)
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', **cors},
        'body': json.dumps({'url': cdn_url, 'mime': mime}),
    }
