import json
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
        
        # Пока заглушка - вернем успех
        return {
            'statusCode': 200,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'success': True, 'message': 'Received'}),
            'isBase64Encoded': False
        }
            
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }