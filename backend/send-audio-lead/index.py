import json
import base64
import urllib.request
import urllib.parse

TELEGRAM_TOKEN = "8081347931:AAGTto62t8bmIIzdDZu5wYip0QP95JJxvIc"
USER_IDS = ["5215501225", "1526249125"]

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
        
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendVoice"
        
        for user_id in USER_IDS:
            boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
            body_parts = []
            body_parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n{user_id}\r\n')
            body_parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n{caption}\r\n')
            body_parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="voice"; filename="lead.ogg"\r\nContent-Type: audio/ogg\r\n\r\n')
            body_bytes = ''.join(body_parts).encode('utf-8') + audio_data + f'\r\n--{boundary}--\r\n'.encode('utf-8')
            req = urllib.request.Request(url, data=body_bytes, method='POST')
            req.add_header('Content-Type', f'multipart/form-data; boundary={boundary}')
            with urllib.request.urlopen(req, timeout=30) as response:
                pass

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