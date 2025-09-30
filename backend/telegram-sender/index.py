import json
import requests
import base64
import os
import psycopg2
from datetime import datetime
from typing import Dict, Any
import pytz
import re

MOSCOW_TZ = pytz.timezone('Europe/Moscow')

def get_moscow_time():
    """Получить текущее московское время"""
    utc_now = datetime.utcnow().replace(tzinfo=pytz.UTC)
    return utc_now.astimezone(MOSCOW_TZ)

def classify_lead_by_phone(notes: str) -> str:
    """
    Классифицирует лид по наличию российского номера телефона
    Контакт = есть 11-значный номер РФ
    Подход = нет номера телефона
    """
    phone_pattern = r'(?:\+7|8|7)?[\s\-\(]?\d{3}[\s\-\)]?\d{3}[\s\-]?\d{2}[\s\-]?\d{2}'
    
    match = re.search(phone_pattern, notes)
    
    if match:
        return 'контакт'
    else:
        return 'подход'

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Analyze lead with AI, send to Telegram, save ONLY metrics to DB
    Args: event - dict with httpMethod, body containing notes and audio data
          context - object with request_id, function_name, memory_limit_in_mb
    Returns: HTTP response dict with status
    '''
    method: str = event.get('httpMethod', 'GET')
    
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
        audio_data = body_data.get('audio_data')
        user_id = event.get('headers', {}).get('X-User-Id')
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'X-User-Id header required'})
            }
        
        if not notes and not audio_data:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Notes or audio required'})
            }
        
        bot_token = '8081347931:AAGTto62t8bmIIzdDZu5wYip0QP95JJxvIc'
        chat_id = '5215501225'
        
        lead_type = classify_lead_by_phone(notes)
        
        user_name = 'Неизвестный промоутер'
        database_url = os.environ.get('DATABASE_URL')
        if database_url:
            try:
                with psycopg2.connect(database_url) as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            "SELECT name FROM t_p24058207_website_creation_pro.users WHERE id = %s",
                            (int(user_id),)
                        )
                        result = cur.fetchone()
                        if result:
                            user_name = result[0]
            except Exception as db_error:
                print(f"Failed to get user name: {db_error}")
        
        telegram_message_id = None
        
        type_emoji = {
            'подход': '👋',
            'контакт': '📞'
        }
        
        emoji_type = type_emoji.get(lead_type, '❓')
        
        caption = f"""{emoji_type} {lead_type.upper()}
🎙️ IMPERIA PROMO
Промоутер: {user_name}

📝 Отчёт:
{notes}"""
        
        if audio_data:
            try:
                audio_bytes = base64.b64decode(audio_data)
                
                audio_url = f'https://api.telegram.org/bot{bot_token}/sendVoice'
                
                files = {
                    'voice': ('audio.webm', audio_bytes, 'audio/webm')
                }
                data = {
                    'chat_id': chat_id,
                    'caption': caption
                }
                
                audio_response = requests.post(audio_url, files=files, data=data)
                
                if audio_response.ok:
                    telegram_message_id = audio_response.json().get('result', {}).get('message_id')
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Failed to send to Telegram'})
                    }
            except Exception as audio_error:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Audio processing error: {str(audio_error)}'})
                }
        else:
            text_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
            text_payload = {
                'chat_id': chat_id,
                'text': caption,
                'parse_mode': 'HTML'
            }
            
            text_response = requests.post(text_url, json=text_payload)
            
            if text_response.ok:
                telegram_message_id = text_response.json().get('result', {}).get('message_id')
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Failed to send to Telegram'})
                }
        
        if database_url:
            try:
                with psycopg2.connect(database_url) as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """INSERT INTO t_p24058207_website_creation_pro.leads_analytics 
                            (user_id, lead_type, lead_result, telegram_message_id, created_at) 
                            VALUES (%s, %s, %s, %s, %s)""",
                            (
                                int(user_id),
                                lead_type,
                                '',
                                telegram_message_id,
                                get_moscow_time()
                            )
                        )
                        conn.commit()
            except Exception as db_error:
                print(f"Database error: {db_error}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'message': 'Lead analyzed and sent',
                'lead_type': lead_type
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Server error: {str(e)}'})
        }