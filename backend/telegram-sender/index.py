import json
import requests
import base64
import os
import psycopg2
from datetime import datetime
from typing import Dict, Any
import pytz
import re
from google.oauth2 import service_account
from googleapiclient.discovery import build
import threading

MOSCOW_TZ = pytz.timezone('Europe/Moscow')

def get_moscow_time():
    """Получить текущее московское время"""
    utc_now = datetime.utcnow().replace(tzinfo=pytz.UTC)
    return utc_now.astimezone(MOSCOW_TZ)

def send_to_google_sheets(user_name: str, lead_type: str, notes: str, has_audio: bool, moscow_time: datetime, organization_name: str = ''):
    """Отправить данные лида в Google Таблицы"""
    try:
        credentials_json = os.environ.get('GOOGLE_SHEETS_CREDENTIALS_NEW')
        sheet_id = os.environ.get('GOOGLE_SHEET_ID_NEW')
        
        if not credentials_json or not sheet_id:
            print('Google Sheets not configured, skipping')
            return
        
        credentials_dict = json.loads(credentials_json)
        credentials = service_account.Credentials.from_service_account_info(
            credentials_dict,
            scopes=['https://www.googleapis.com/auth/spreadsheets']
        )
        
        service = build('sheets', 'v4', credentials=credentials)
        
        formatted_time = moscow_time.strftime('%d.%m.%Y %H:%M:%S')
        audio_status = 'Да' if has_audio else 'Нет'
        
        values = [[
            formatted_time,
            user_name,
            organization_name if organization_name else 'Не указана',
            lead_type,
            notes,
            audio_status
        ]]
        
        body = {
            'values': values
        }
        
        service.spreadsheets().values().append(
            spreadsheetId=sheet_id,
            range='A:F',
            valueInputOption='RAW',
            insertDataOption='INSERT_ROWS',
            body=body
        ).execute()
        
        print(f'Successfully sent to Google Sheets: {user_name}, {organization_name}, {lead_type}')
        
    except Exception as e:
        print(f'Failed to send to Google Sheets: {e}')

def classify_lead_by_phone(notes: str) -> str:
    """
    Все лиды считаются контактами
    """
    return 'контакт'

def send_telegram_async(bot_token: str, chat_id: str, caption: str, audio_data: str, notes: str, user_id: str, user_name: str, organization_id: int, organization_name: str, lead_type: str, database_url: str):
    '''
    Асинхронная отправка в Telegram и сохранение в БД
    Выполняется в отдельном потоке, не блокирует ответ пользователю
    '''
    try:
        telegram_message_id = None
        
        if audio_data:
            try:
                audio_bytes = base64.b64decode(audio_data)
                audio_url = f'https://api.telegram.org/bot{bot_token}/sendVoice'
                files = {'voice': ('audio.webm', audio_bytes, 'audio/webm')}
                data = {'chat_id': chat_id, 'caption': caption}
                audio_response = requests.post(audio_url, files=files, data=data)
                if audio_response.ok:
                    telegram_message_id = audio_response.json().get('result', {}).get('message_id')
                else:
                    print(f'Failed to send audio to Telegram: {audio_response.text}')
            except Exception as audio_error:
                print(f'Audio processing error: {audio_error}')
        else:
            text_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
            text_payload = {'chat_id': chat_id, 'text': caption, 'parse_mode': 'HTML'}
            text_response = requests.post(text_url, json=text_payload)
            if text_response.ok:
                telegram_message_id = text_response.json().get('result', {}).get('message_id')
            else:
                print(f'Failed to send text to Telegram: {text_response.text}')
        
        moscow_time = get_moscow_time()
        
        if database_url:
            try:
                with psycopg2.connect(database_url) as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """INSERT INTO t_p24058207_website_creation_pro.leads_analytics 
                            (user_id, lead_type, lead_result, telegram_message_id, organization_id, created_at) 
                            VALUES (%s, %s, %s, %s, %s, %s)""",
                            (int(user_id), lead_type, '', telegram_message_id, organization_id, moscow_time)
                        )
                        conn.commit()
                print(f'Lead saved to DB: {user_name}, {lead_type}')
            except Exception as db_error:
                print(f'Failed to save to DB: {db_error}')
        
        send_to_google_sheets(user_name, lead_type, notes, bool(audio_data), moscow_time, organization_name)
        
    except Exception as e:
        print(f'Async send error: {e}')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Accept lead, return success immediately, send to Telegram asynchronously
    Args: event - dict with httpMethod, body containing notes and audio data
          context - object with request_id, function_name, memory_limit_in_mb
    Returns: HTTP response dict with immediate success
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
        organization_id = body_data.get('organization_id')
        organization_name = body_data.get('organization_name', '')
        user_id = event.get('headers', {}).get('X-User-Id')
        
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
        
        bot_token = '8081347931:AAGTto62t8bmIIzdDZu5wYip0QP95JJxvIc'
        chat_id = '5215501225'
        database_url = os.environ.get('DATABASE_URL')
        
        lead_type = classify_lead_by_phone(notes)
        
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
        
        type_emoji = {'подход': '👋', 'контакт': '📞'}
        emoji_type = type_emoji.get(lead_type, '❓')
        org_info = f"\n🏢 Организация: {organization_name}" if organization_name else ""
        
        caption = f"""{emoji_type} {lead_type.upper()}
🎙️ IMPERIA PROMO
Промоутер: {user_name}{org_info}

📝 Отчёт:
{notes}"""
        
        thread = threading.Thread(
            target=send_telegram_async,
            args=(bot_token, chat_id, caption, audio_data, notes, user_id, user_name, organization_id, organization_name, lead_type, database_url)
        )
        thread.daemon = True
        thread.start()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'message': 'Лид принят и обрабатывается',
                'lead_type': lead_type
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Server error: {str(e)}'})
        }