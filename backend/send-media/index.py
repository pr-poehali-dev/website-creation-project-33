"""
Отправка аудио/видео лидов в Telegram
Быстрая версия с минимальными зависимостями
"""

import json
import requests
import base64
import os
import psycopg2
from datetime import datetime
from typing import Dict, Any
import pytz

MOSCOW_TZ = pytz.timezone('Europe/Moscow')

def get_moscow_time():
    """Получить текущее московское время"""
    utc_now = datetime.utcnow().replace(tzinfo=pytz.UTC)
    return utc_now.astimezone(MOSCOW_TZ)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Принять лид с аудио/видео и отправить в Telegram
    Args: event с httpMethod, body, headers; context с request_id
    Returns: JSON с результатом отправки
    """
    method = event.get('httpMethod', 'GET')
    
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
        organization_id = body_data.get('organization_id')
        organization_name = body_data.get('organization_name', '')
        media_type = body_data.get('media_type', 'audio')
        user_id = event.get('headers', {}).get('X-User-Id')
        
        print(f'📥 Received: user_id={user_id}, media_type={media_type}, has_data={bool(audio_data)}')
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'X-User-Id header required'})
            }
        
        if int(user_id) == 6853:
            return {
                'statusCode': 403,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Свяжитесь с Максимом'})
            }
        
        if not notes and not audio_data:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Notes or audio required'})
            }
        
        # Получить имя пользователя из БД
        database_url = os.environ.get('DATABASE_URL')
        user_name = 'Неизвестный промоутер'
        
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
        
        # Формирование сообщения
        org_info = f"\n🏢 Организация: {organization_name}" if organization_name else ""
        caption = f"""📞 КОНТАКТ
🎙️ IMPERIA PROMO
Промоутер: {user_name}{org_info}

📝 Отчёт:
{notes}"""
        
        # Отправка в Telegram
        bot_token = '8081347931:AAGTto62t8bmIIzdDZu5wYip0QP95JJxvIc'
        chat_id = '5215501225'
        telegram_message_id = None
        
        if audio_data:
            try:
                media_bytes = base64.b64decode(audio_data)
                print(f'📦 Media size: {len(media_bytes)} bytes')
                
                if media_type == 'video':
                    print('🎥 Sending as video...')
                    media_url = f'https://api.telegram.org/bot{bot_token}/sendVideo'
                    files = {'video': ('video.webm', media_bytes, 'video/webm')}
                    data = {'chat_id': chat_id, 'caption': caption}
                    media_response = requests.post(media_url, files=files, data=data, timeout=60)
                    
                    if media_response.ok:
                        telegram_message_id = media_response.json().get('result', {}).get('message_id')
                        print(f'✅ Video sent successfully, message_id: {telegram_message_id}')
                    else:
                        print(f'❌ Failed to send video: {media_response.status_code} {media_response.text}')
                else:
                    print('🎤 Sending as audio...')
                    audio_url = f'https://api.telegram.org/bot{bot_token}/sendVoice'
                    files = {'voice': ('audio.webm', media_bytes, 'audio/webm')}
                    data = {'chat_id': chat_id, 'caption': caption}
                    audio_response = requests.post(audio_url, files=files, data=data, timeout=30)
                    
                    if audio_response.ok:
                        telegram_message_id = audio_response.json().get('result', {}).get('message_id')
                        print(f'✅ Audio sent successfully, message_id: {telegram_message_id}')
                    else:
                        print(f'❌ Failed to send audio: {audio_response.status_code} {audio_response.text}')
            except Exception as media_error:
                print(f'❌ Media processing error: {media_error}')
        else:
            # Только текст без медиа
            text_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
            text_payload = {'chat_id': chat_id, 'text': caption, 'parse_mode': 'HTML'}
            text_response = requests.post(text_url, json=text_payload)
            if text_response.ok:
                telegram_message_id = text_response.json().get('result', {}).get('message_id')
        
        # Сохранение в БД
        if database_url and telegram_message_id:
            try:
                moscow_time = get_moscow_time()
                with psycopg2.connect(database_url) as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """INSERT INTO t_p24058207_website_creation_pro.leads_analytics 
                            (user_id, lead_type, lead_result, telegram_message_id, organization_id, created_at) 
                            VALUES (%s, %s, %s, %s, %s, %s)""",
                            (int(user_id), 'контакт', '', telegram_message_id, organization_id, moscow_time)
                        )
                        conn.commit()
                print(f'✅ Lead saved to DB')
            except Exception as db_error:
                print(f'❌ Failed to save to DB: {db_error}')
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': True,
                'message': 'Лид отправлен в Telegram',
                'media_type': media_type
            })
        }
        
    except Exception as e:
        print(f'❌ Handler error: {e}')
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }