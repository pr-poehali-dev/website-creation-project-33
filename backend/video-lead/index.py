import json
import base64
import urllib.request
import urllib.parse

TELEGRAM_TOKEN = "8081347931:AAGTto62t8bmIIzdDZu5wYip0QP95JJxvIc"
USER_ID = "5215501225"

def handler(event: dict, context) -> dict:
    """Отправляет видео-лид в Telegram"""
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    try:
        body = event.get('body', '{}')
        data = json.loads(body)
        
        video_base64 = data.get('video')
        parent_name = data.get('parentName', '')
        child_name = data.get('childName', '')
        child_age = data.get('childAge', '')
        
        if not video_base64:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Video data missing'}),
                'isBase64Encoded': False
            }
        
        # Декодируем base64
        video_data = base64.b64decode(video_base64)
        
        # Формируем сообщение
        caption = f"🎯 Новый лид!\n\n👨‍👩‍👧 Родитель: {parent_name}\n👶 Ребенок: {child_name}\n🎂 Возраст: {child_age}"
        
        # Формируем multipart/form-data
        boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
        body_parts = []
        
        # Добавляем chat_id
        body_parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n{USER_ID}\r\n')
        
        # Добавляем caption
        body_parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n{caption}\r\n')
        
        # Добавляем видео
        body_parts.append(f'--{boundary}\r\nContent-Disposition: form-data; name="video"; filename="lead.mp4"\r\nContent-Type: video/mp4\r\n\r\n')
        
        body_bytes = ''.join(body_parts).encode('utf-8') + video_data + f'\r\n--{boundary}--\r\n'.encode('utf-8')
        
        # Отправляем в Telegram
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendVideo"
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