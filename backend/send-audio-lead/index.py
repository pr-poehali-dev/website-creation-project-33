import json
import os
import base64
import urllib.request
import urllib.parse

def handler(event: dict, context) -> dict:
    """Отправляет аудио-лид в Telegram"""
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        telegram_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        chat_id = os.environ.get('TELEGRAM_CHAT_ID')
        
        if not telegram_token or not chat_id:
            return {
                'statusCode': 500,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Telegram credentials not configured'}),
                'isBase64Encoded': False
            }
        
        body = event.get('body', '{}')
        data = json.loads(body)
        
        notes = data.get('notes', '')
        audio_base64 = data.get('audio_data', '')
        organization_name = data.get('organization_name', 'Неизвестная организация')
        
        if not audio_base64:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Audio data missing'}),
                'isBase64Encoded': False
            }
        
        # Декодируем base64
        audio_data = base64.b64decode(audio_base64)
        
        # Формируем сообщение
        caption = f"🎯 Новый лид!\n\n📍 {organization_name}\n📝 {notes}"
        
        # Формируем multipart/form-data
        boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
        body_parts = []
        
        # Добавляем chat_id
        body_parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n{chat_id}\r\n')
        
        # Добавляем caption
        body_parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n{caption}\r\n')
        
        # Добавляем аудио
        body_parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="voice"; filename="lead.ogg"\r\nContent-Type: audio/ogg\r\n\r\n')
        
        body_bytes = ''.join(body_parts).encode('utf-8') + audio_data + f'\r\n--{boundary}--\r\n'.encode('utf-8')
        
        # Отправляем в Telegram
        url = f"https://api.telegram.org/bot{telegram_token}/sendVoice"
        req = urllib.request.Request(url, data=body_bytes, method='POST')
        req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
        
        with urllib.request.urlopen(req, timeout=30) as response:
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'success': True}),
                'isBase64Encoded': False
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
