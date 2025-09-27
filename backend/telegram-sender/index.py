import json
import requests
import base64
import os
import psycopg2
from datetime import datetime
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
        user_id = event.get('headers', {}).get('X-User-Id')  # Get user ID from header
        
        bot_token = '8081347931:AAGTto62t8bmIIzdDZu5wYip0QP95JJxvIc'
        chat_id = '5215501225'
        
        # Record lead in database if user_id provided
        if user_id and (notes or audio_data):
            try:
                database_url = os.environ.get('DATABASE_URL')
                if database_url:
                    with psycopg2.connect(database_url) as conn:
                        with conn.cursor() as cur:
                            cur.execute(
                                "INSERT INTO leads (user_id, notes, has_audio, created_at) VALUES (%s, %s, %s, %s)",
                                (int(user_id), notes or None, bool(audio_data), datetime.now())
                            )
                            conn.commit()
            except Exception as db_error:
                # Log database error but continue with Telegram sending
                print(f"Database error: {db_error}")
        
        # Send combined message with audio and notes
        if audio_data and notes:
            # Send audio with notes as caption
            try:
                audio_bytes = base64.b64decode(audio_data)
                
                audio_url = f'https://api.telegram.org/bot{bot_token}/sendVoice'
                
                files = {
                    'voice': ('audio.webm', audio_bytes, 'audio/webm')
                }
                data = {
                    'chat_id': chat_id,
                    'caption': f'🎙️ IMPERIA PROMO\n\n📝 Заметка:\n{notes}'
                }
                
                audio_response = requests.post(audio_url, files=files, data=data)
                if not audio_response.ok:
                    return {
                        'statusCode': 400,
                        'headers': {'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Failed to send combined message'})
                    }
            except Exception as audio_error:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Audio processing error: {str(audio_error)}'})
                }
        elif audio_data:
            # Send only audio
            try:
                audio_bytes = base64.b64decode(audio_data)
                
                audio_url = f'https://api.telegram.org/bot{bot_token}/sendVoice'
                
                files = {
                    'voice': ('audio.webm', audio_bytes, 'audio/webm')
                }
                data = {
                    'chat_id': chat_id,
                    'caption': '🎙️ IMPERIA PROMO\n\n🎤 Контроль качества'
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
        elif notes:
            # Send only notes
            text_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
            text_payload = {
                'chat_id': chat_id,
                'text': f'📝 IMPERIA PROMO\n\nЗаметка:\n{notes}',
                'parse_mode': 'HTML'
            }
            
            text_response = requests.post(text_url, json=text_payload)
            if not text_response.ok:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Failed to send text message'})
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