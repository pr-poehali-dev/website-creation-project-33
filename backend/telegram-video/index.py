import json
import base64
import os
from typing import Dict, Any
import requests
import psycopg2

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Send shift confirmation photos to Telegram
    Args: event with httpMethod, body containing photo_data, photo_type, organization_id
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
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
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
        user_id = event.get('headers', {}).get('X-User-Id') or event.get('headers', {}).get('x-user-id')
        if not user_id:
            return {
                'statusCode': 401,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'X-User-Id header required'})
            }
        
        body_data = json.loads(event.get('body', '{}'))
        photo_base64 = body_data.get('photo_data')
        photo_type = body_data.get('photo_type')
        organization_id = body_data.get('organization_id')
        
        if not photo_base64 or not photo_type or not organization_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': 'Missing photo_data, photo_type or organization_id'})
            }
        
        photo_base64_clean = photo_base64.strip().replace('\n', '').replace('\r', '')
        missing_padding = len(photo_base64_clean) % 4
        if missing_padding:
            photo_base64_clean += '=' * (4 - missing_padding)
        
        photo_bytes = base64.b64decode(photo_base64_clean)
        print(f'Photo size: {len(photo_bytes)} bytes, org_id: {organization_id}, type: {photo_type}')
        
        bot_token = '8081347931:AAGTto62t8bmIIzdDZu5wYip0QP95JJxvIc'
        chat_id = '5215501225'
        
        user_name = 'Неизвестный промоутер'
        organization_name = f'ID: {organization_id}'
        
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
                        
                        cur.execute(
                            "SELECT name FROM t_p24058207_website_creation_pro.organizations WHERE id = %s",
                            (int(organization_id),)
                        )
                        org_result = cur.fetchone()
                        if org_result:
                            organization_name = org_result[0]
            except Exception as e:
                print(f'DB error: {e}')
        
        photo_type_text = 'начала смены' if photo_type == 'start' else 'окончания смены'
        caption = f"📸 Фото {photo_type_text}\n👤 Промоутер: {user_name}\n🏢 Организация: {organization_name}"
        
        url = f'https://api.telegram.org/bot{bot_token}/sendPhoto'
        files = {'photo': ('shift_photo.jpg', photo_bytes, 'image/jpeg')}
        data = {'chat_id': chat_id, 'caption': caption}
        
        print(f'Sending photo to Telegram...')
        response = requests.post(url, files=files, data=data, timeout=30)
        print(f'Telegram response status: {response.status_code}')
        
        if not response.ok:
            error_text = response.text
            print(f'Telegram error: {error_text}')
            return {
                'statusCode': 500,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'error': f'Failed to send to Telegram: {error_text}'})
            }
        
        telegram_message_id = None
        try:
            telegram_response = response.json()
            if 'result' in telegram_response and 'message_id' in telegram_response['result']:
                telegram_message_id = telegram_response['result']['message_id']
        except Exception as e:
            print(f'Error parsing Telegram response: {e}')
        
        if database_url:
            try:
                with psycopg2.connect(database_url) as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            INSERT INTO t_p24058207_website_creation_pro.shift_videos 
                            (user_id, organization_id, video_type, telegram_message_id, work_date) 
                            VALUES (%s, %s, %s, %s, (CURRENT_TIMESTAMP + INTERVAL '3 hours')::date)
                            """,
                            (int(user_id), int(organization_id), photo_type, telegram_message_id)
                        )
                        conn.commit()
                        print(f'Saved shift photo record: user={user_id}, org={organization_id}, type={photo_type}')
            except Exception as e:
                print(f'Error saving shift photo record: {e}')
        
        contacts_today = 0
        if photo_type == 'end' and database_url:
            try:
                with psycopg2.connect(database_url) as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """
                            SELECT COUNT(*) FROM t_p24058207_website_creation_pro.leads
                            WHERE user_id = %s 
                            AND organization_id = %s 
                            AND DATE(created_at) = CURRENT_DATE
                            """,
                            (int(user_id), int(organization_id))
                        )
                        count_result = cur.fetchone()
                        if count_result:
                            contacts_today = count_result[0]
                        print(f'Contacts today for user {user_id} in org {organization_id}: {contacts_today}')
            except Exception as e:
                print(f'Error counting contacts: {e}')
        
        response_body = {'success': True}
        if photo_type == 'end':
            response_body['contacts_today'] = contacts_today
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'isBase64Encoded': False,
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }
