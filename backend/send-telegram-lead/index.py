import json
import requests
import base64

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
        body = event.get('body', '')
        is_base64 = event.get('isBase64Encoded', False)
        
        if is_base64:
            body = base64.b64decode(body)
        
        # Парсим multipart/form-data вручную
        content_type = event.get('headers', {}).get('content-type', '')
        if 'multipart/form-data' not in content_type:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Expected multipart/form-data'}),
                'isBase64Encoded': False
            }
        
        # Извлекаем boundary
        boundary = content_type.split('boundary=')[1]
        parts = body.split(f'--{boundary}'.encode())
        
        video_data = None
        parent_name = ''
        child_name = ''
        child_age = ''
        
        for part in parts:
            if b'Content-Disposition' in part:
                if b'name="video"' in part:
                    video_data = part.split(b'\r\n\r\n', 1)[1].rsplit(b'\r\n', 1)[0]
                elif b'name="parentName"' in part:
                    parent_name = part.split(b'\r\n\r\n', 1)[1].rsplit(b'\r\n', 1)[0].decode('utf-8')
                elif b'name="childName"' in part:
                    child_name = part.split(b'\r\n\r\n', 1)[1].rsplit(b'\r\n', 1)[0].decode('utf-8')
                elif b'name="childAge"' in part:
                    child_age = part.split(b'\r\n\r\n', 1)[1].rsplit(b'\r\n', 1)[0].decode('utf-8')
        
        if not video_data:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Video not found'}),
                'isBase64Encoded': False
            }
        
        # Формируем сообщение
        caption = f"🎯 Новый лид!\n\n👨‍👩‍👧 Родитель: {parent_name}\n👶 Ребенок: {child_name}\n🎂 Возраст: {child_age}"
        
        # Отправляем видео в Telegram
        url = f"https://api.telegram.org/bot{TELEGRAM_TOKEN}/sendVideo"
        files = {'video': ('lead.mp4', video_data, 'video/mp4')}
        data = {'chat_id': USER_ID, 'caption': caption}
        
        response = requests.post(url, files=files, data=data, timeout=30)
        
        if response.status_code == 200:
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'success': True, 'message': 'Лид отправлен'}),
                'isBase64Encoded': False
            }
        else:
            return {
                'statusCode': 500,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': f'Telegram error: {response.text}'}),
                'isBase64Encoded': False
            }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }
