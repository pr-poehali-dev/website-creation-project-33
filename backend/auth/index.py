'''
Система авторизации и управления пользователями
Args: event с httpMethod, body, headers; context с request_id 
Returns: JSON с токенами авторизации или ошибками
'''

import json
import os
import secrets
import bcrypt
import psycopg2
from datetime import datetime, timedelta
from typing import Dict, Any, Optional
import pytz

# Московская временная зона
MOSCOW_TZ = pytz.timezone('Europe/Moscow')

def get_moscow_time():
    """Получить текущее московское время"""
    utc_now = datetime.utcnow().replace(tzinfo=pytz.UTC)
    return utc_now.astimezone(MOSCOW_TZ)

def get_client_ip(event: Dict[str, Any]) -> str:
    """Извлечь IP адрес клиента из события"""
    # Сначала пробуем получить из заголовков (реальный IP клиента через прокси)
    headers = event.get('headers', {})
    
    # X-Forwarded-For может содержать цепочку IP: "client, proxy1, proxy2"
    x_forwarded_for = (
        headers.get('X-Forwarded-For') or 
        headers.get('x-forwarded-for') or
        headers.get('X-FORWARDED-FOR')
    )
    if x_forwarded_for:
        # Берем первый IP из цепочки (это и есть реальный клиент)
        client_ip = x_forwarded_for.split(',')[0].strip()
        if client_ip:
            return client_ip
    
    # X-Real-IP
    x_real_ip = (
        headers.get('X-Real-IP') or 
        headers.get('x-real-ip') or
        headers.get('X-REAL-IP')
    )
    if x_real_ip:
        return x_real_ip.strip()
    
    # CF-Connecting-IP (Cloudflare)
    cf_ip = (
        headers.get('CF-Connecting-IP') or 
        headers.get('cf-connecting-ip')
    )
    if cf_ip:
        return cf_ip.strip()
    
    # Если не нашли в заголовках, берем из requestContext (это будет IP прокси)
    request_context = event.get('requestContext', {})
    identity = request_context.get('identity', {})
    return identity.get('sourceIp', 'unknown')

def is_ip_blocked(ip_address: str) -> bool:
    """Проверить заблокирован ли IP адрес"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "SELECT COUNT(*) FROM t_p24058207_website_creation_pro.blocked_ips WHERE ip_address = %s",
                (ip_address,)
            )
            count = cur.fetchone()[0]
            return count > 0

def block_ip(ip_address: str, reason: str = 'User deleted by admin'):
    """Заблокировать IP адрес"""
    if not ip_address or ip_address == 'unknown':
        return
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO t_p24058207_website_creation_pro.blocked_ips (ip_address, blocked_reason) VALUES (%s, %s) ON CONFLICT (ip_address) DO NOTHING",
                (ip_address, reason)
            )
            conn.commit()

def get_db_connection():
    """Получить подключение к базе данных"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise Exception('DATABASE_URL not found in environment')
    return psycopg2.connect(database_url)

def hash_password(password: str) -> str:
    """Хешировать пароль"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Проверить пароль"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_session(user_id: int) -> str:
    """Создать сессию для пользователя"""
    session_token = secrets.token_urlsafe(32)
    expires_at = get_moscow_time() + timedelta(days=7)
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "INSERT INTO t_p24058207_website_creation_pro.user_sessions (user_id, session_token, expires_at) VALUES (%s, %s, %s)",
                (user_id, session_token, expires_at)
            )
            conn.commit()
    
    return session_token

def get_user_by_session(session_token: str) -> Optional[Dict[str, Any]]:
    """Получить пользователя по токену сессии"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.id, u.email, u.name, u.is_admin 
                FROM t_p24058207_website_creation_pro.users u 
                JOIN t_p24058207_website_creation_pro.user_sessions s ON u.id = s.user_id 
                WHERE s.session_token = %s AND s.expires_at > %s AND u.is_active = TRUE
            """, (session_token, get_moscow_time()))
            
            row = cur.fetchone()
            if row:
                return {
                    'id': row[0],
                    'email': row[1], 
                    'name': row[2],
                    'is_admin': row[3]
                }
    return None

def update_last_seen(user_id: int):
    """Обновить время последнего посещения"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE t_p24058207_website_creation_pro.users SET last_seen = %s WHERE id = %s",
                (get_moscow_time(), user_id)
            )
            conn.commit()

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }

    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'register':
            email = body_data.get('email', '').strip()
            password = body_data.get('password', '')
            name = body_data.get('name', '').strip()
            latitude = body_data.get('latitude')
            longitude = body_data.get('longitude')
            
            if not email or not password or not name:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Все поля обязательны'})
                }
            
            client_ip = get_client_ip(event)
            print(f'🌐 Registration IP: {client_ip}, Headers: {event.get("headers", {})}')
            
            # Временно отключено: проверка блокировки IP
            # if is_ip_blocked(client_ip):
            #     return {
            #         'statusCode': 403,
            #         'headers': headers,
            #         'body': json.dumps({'error': 'Регистрация с этого IP адреса заблокирована'})
            #     }
            
            try:
                password_hash = hash_password(password)
                
                with get_db_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            "INSERT INTO t_p24058207_website_creation_pro.users (email, password_hash, name, registration_ip, is_approved, latitude, longitude, location_updated_at) VALUES (%s, %s, %s, %s, FALSE, %s, %s, %s) RETURNING id",
                            (email, password_hash, name, client_ip, latitude, longitude, get_moscow_time())
                        )
                        user_id = cur.fetchone()[0]
                        conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'success': True,
                        'pending_approval': True,
                        'message': 'Заявка на регистрацию отправлена. Ожидайте одобрения администратора.'
                    })
                }
                
            except psycopg2.IntegrityError:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Пользователь с таким email уже существует'})
                }
        
        elif action == 'login':
            email = body_data.get('email', '').strip()
            password = body_data.get('password', '')
            latitude = body_data.get('latitude')
            longitude = body_data.get('longitude')
            
            if not email or not password:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Email и пароль обязательны'})
                }
            
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "SELECT id, password_hash, name, is_admin, is_approved, is_active FROM t_p24058207_website_creation_pro.users WHERE email = %s",
                        (email,)
                    )
                    row = cur.fetchone()
            
            if not row:
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Пользователь не найден'})
                }
            
            user_id, password_hash, name, is_admin, is_approved, is_active = row
            
            # Проверка: деактивирован ли пользователь
            if not is_active:
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Ваш аккаунт деактивирован. Обратитесь к администратору.'})
                }
            
            # Special case for admin with simple password
            if email == 'admin@gmail.com' and password == 'admin':
                password_valid = True
            else:
                password_valid = verify_password(password, password_hash)
            
            if not password_valid:
                return {
                    'statusCode': 401,
                    'headers': headers,
                    'body': json.dumps({'error': 'Неверный пароль'})
                }
            
            # Проверка одобрения (кроме админов)
            if not is_admin and not is_approved:
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Ваша заявка ожидает одобрения администратора'})
                }
            session_token = create_session(user_id)
            update_last_seen(user_id)
            
            # Обновляем IP адрес при каждом логине (для исправления старых записей)
            client_ip = get_client_ip(event)
            
            # Update location and IP if provided
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    if latitude is not None and longitude is not None:
                        cur.execute(
                            "UPDATE t_p24058207_website_creation_pro.users SET latitude = %s, longitude = %s, location_updated_at = %s, registration_ip = %s WHERE id = %s",
                            (latitude, longitude, get_moscow_time(), client_ip, user_id)
                        )
                    else:
                        # Обновляем только IP, если геолокация не передана
                        cur.execute(
                            "UPDATE t_p24058207_website_creation_pro.users SET registration_ip = %s WHERE id = %s",
                            (client_ip, user_id)
                        )
                    conn.commit()
            
            print(f'🔄 Updated IP for user {user_id}: {client_ip}')
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'session_token': session_token,
                    'user': {'id': user_id, 'email': email, 'name': name, 'is_admin': is_admin}
                })
            }
    
    elif method == 'GET':
        session_token = event.get('headers', {}).get('X-Session-Token')
        
        if not session_token:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Токен сессии не найден'})
            }
        
        user = get_user_by_session(session_token)
        if not user:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Недействительный токен сессии'})
            }
        
        update_last_seen(user['id'])
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'user': user})
        }
    
    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'Метод не поддерживается'})
    }