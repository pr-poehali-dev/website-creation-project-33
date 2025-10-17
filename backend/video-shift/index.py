import json
import base64
import os
from typing import Dict, Any
import requests

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Send video confirmations (start/end shift) to Telegram
    Args: event with httpMethod, body containing video, organization_id, type
          context with request_id
    Returns: HTTP response with success status
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        session_token = event.get('headers', {}).get('X-Session-Token') or event.get('headers', {}).get('x-session-token')
        if not session_token:
            return {
                'statusCode': 401,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'No session token'})
            }
        
        body_data = json.loads(event.get('body', '{}'))
        video_base64 = body_data.get('video')
        organization_id = body_data.get('organization_id')
        video_type = body_data.get('type')
        
        if not video_base64 or not organization_id or not video_type:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Missing video, organization_id or type'})
            }
        
        video_bytes = base64.b64decode(video_base64)
        
        bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
        chat_id = os.environ.get('TELEGRAM_CHAT_ID')
        
        if not bot_token or not chat_id:
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Bot token or chat ID not configured'})
            }
        
        auth_response = requests.get(
            'https://functions.poehali.dev/d4f30ed2-6b6b-4e8a-a691-2c364dd41e43',
            headers={'X-Session-Token': session_token}
        )
        
        if not auth_response.ok:
            return {
                'statusCode': 401,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Invalid session'})
            }
        
        user_data = auth_response.json()
        user_name = user_data.get('user', {}).get('name', 'Неизвестный')
        
        video_type_text = 'начала смены' if video_type == 'start' else 'окончания смены'
        caption = f"🎥 Видео {video_type_text}\n👤 Промоутер: {user_name}\n🏢 Организация ID: {organization_id}"
        
        url = f'https://api.telegram.org/bot{bot_token}/sendVideo'
        files = {'video': ('shift_video.webm', video_bytes, 'video/webm')}
        data = {'chat_id': chat_id, 'caption': caption}
        
        response = requests.post(url, files=files, data=data, timeout=30)
        
        if not response.ok:
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Failed to send video to Telegram'})
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'success': True})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }