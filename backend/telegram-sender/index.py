import json
import requests
import base64
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Send notes and audio to Telegram bot
    Args: event - dict with httpMethod, body containing notes and audio data
          context - object with request_id, function_name, memory_limit_in_mb
    Returns: HTTP response dict with status
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
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
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        notes = body_data.get('notes', '').strip()
        audio_data = body_data.get('audio_data')  # base64 encoded audio
        
        bot_token = '8081347931:AAGTto62t8bmIIzdDZu5wYip0QP95JJxvIc'
        chat_id = '5215501225'
        
        # Send notes if provided
        if notes:
            text_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
            text_payload = {
                'chat_id': chat_id,
                'text': f'📝 Новая заметка:\n\n{notes}',
                'parse_mode': 'HTML'
            }
            
            text_response = requests.post(text_url, json=text_payload)
            if not text_response.ok:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Failed to send text message'})
                }
        
        # Send audio if provided
        if audio_data:
            try:
                # Decode base64 audio data
                audio_bytes = base64.b64decode(audio_data)
                
                audio_url = f'https://api.telegram.org/bot{bot_token}/sendVoice'
                
                files = {
                    'voice': ('audio.webm', audio_bytes, 'audio/webm')
                }
                data = {
                    'chat_id': chat_id,
                    'caption': '🎤 Аудиозапись'
                }
                
                audio_response = requests.post(audio_url, files=files, data=data)
                if not audio_response.ok:
                    return {
                        'statusCode': 400,
                        'headers': {'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Failed to send audio message'})
                    }
            except Exception as audio_error:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Audio processing error: {str(audio_error)}'})
                }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'message': 'Data sent to Telegram successfully'
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Server error: {str(e)}'})
        }