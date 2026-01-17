import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: dict, context) -> dict:
    '''Webhook для обработки обновлений Telegram бота'''
    
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        query_params = event.get('queryStringParameters', {}) or {}
        action = query_params.get('action')
        
        if action == 'get_users':
            return get_users()
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unknown action'}),
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    try:
        # Парсинг обновления от Telegram
        body = event.get('body', '{}')
        update = json.loads(body) if isinstance(body, str) else body
        
        # Обработка сообщения
        if 'message' in update:
            message = update['message']
            chat_id = message['chat']['id']
            telegram_user = message['from']
            
            # Обработка команды /start
            if 'text' in message and message['text'] == '/start':
                send_phone_request(chat_id)
                return success_response('Phone request sent')
            
            # Обработка отправки номера телефона
            if 'contact' in message:
                contact = message['contact']
                phone = contact.get('phone_number')
                user_id = contact.get('user_id')
                
                # Проверяем, что пользователь отправил свой номер
                if user_id == telegram_user['id']:
                    save_user(telegram_user, phone)
                    send_message(chat_id, f'✅ Спасибо! Ваш номер {phone} сохранён.')
                else:
                    send_message(chat_id, '⚠️ Пожалуйста, отправьте ваш собственный номер телефона.')
                
                return success_response('Contact processed')
        
        return success_response('Update processed')
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)}),
            'isBase64Encoded': False
        }

def send_phone_request(chat_id: int):
    '''Отправляет запрос на номер телефона'''
    import requests
    
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    url = f'https://api.telegram.org/bot{token}/sendMessage'
    
    keyboard = {
        'keyboard': [[
            {
                'text': '📱 Отправить номер телефона',
                'request_contact': True
            }
        ]],
        'resize_keyboard': True,
        'one_time_keyboard': True
    }
    
    payload = {
        'chat_id': chat_id,
        'text': 'Добро пожаловать! 👋\n\nДля продолжения нажмите кнопку ниже, чтобы поделиться вашим номером телефона.',
        'reply_markup': json.dumps(keyboard)
    }
    
    requests.post(url, json=payload)

def send_message(chat_id: int, text: str):
    '''Отправляет текстовое сообщение'''
    import requests
    
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    url = f'https://api.telegram.org/bot{token}/sendMessage'
    
    payload = {
        'chat_id': chat_id,
        'text': text
    }
    
    requests.post(url, json=payload)

def save_user(telegram_user: dict, phone: str):
    '''Сохраняет данные пользователя в БД'''
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor()
    
    try:
        cursor.execute('''
            INSERT INTO telegram_users (telegram_id, phone_number, username, first_name, last_name)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (telegram_id) 
            DO UPDATE SET 
                phone_number = EXCLUDED.phone_number,
                username = EXCLUDED.username,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                updated_at = CURRENT_TIMESTAMP
        ''', (
            telegram_user.get('id'),
            phone,
            telegram_user.get('username'),
            telegram_user.get('first_name'),
            telegram_user.get('last_name')
        ))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

def get_users():
    '''Получает список всех пользователей бота'''
    conn = psycopg2.connect(os.environ.get('DATABASE_URL'))
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        cursor.execute('''
            SELECT id, telegram_id, phone_number, username, first_name, last_name, created_at, updated_at
            FROM telegram_users
            ORDER BY created_at DESC
        ''')
        users = cursor.fetchall()
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'users': [dict(u) for u in users]}, default=str),
            'isBase64Encoded': False
        }
    finally:
        cursor.close()
        conn.close()

def success_response(message: str):
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'status': 'ok', 'message': message}),
        'isBase64Encoded': False
    }