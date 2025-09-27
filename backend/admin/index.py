'''
Функции администратора для управления пользователями и статистикой
Args: event с httpMethod, body, headers; context с request_id
Returns: JSON с данными пользователей, статистикой лидов
'''

import json
import os
import psycopg2
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import pytz

# Московская временная зона
MOSCOW_TZ = pytz.timezone('Europe/Moscow')

def get_moscow_time():
    """Получить текущее московское время"""
    utc_now = datetime.utcnow().replace(tzinfo=pytz.UTC)
    return utc_now.astimezone(MOSCOW_TZ)

def get_db_connection():
    """Получить подключение к базе данных"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise Exception('DATABASE_URL not found in environment')
    return psycopg2.connect(database_url)

def get_user_by_session(session_token: str) -> Optional[Dict[str, Any]]:
    """Получить пользователя по токену сессии"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.id, u.email, u.name, u.is_admin 
                FROM t_p24058207_website_creation_pro.users u 
                JOIN t_p24058207_website_creation_pro.user_sessions s ON u.id = s.user_id 
                WHERE s.session_token = %s AND s.expires_at > %s
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

def get_all_users() -> List[Dict[str, Any]]:
    """Получить всех пользователей с информацией об онлайн статусе"""
    online_threshold = get_moscow_time() - timedelta(minutes=5)
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.id, u.email, u.name, u.is_admin, u.last_seen, u.created_at,
                       CASE WHEN u.last_seen > %s THEN true ELSE false END as is_online
                FROM t_p24058207_website_creation_pro.users u 
                ORDER BY u.created_at DESC
            """, (online_threshold,))
            
            users = []
            for row in cur.fetchall():
                users.append({
                    'id': row[0],
                    'email': row[1],
                    'name': row[2],
                    'is_admin': row[3],
                    'last_seen': row[4].isoformat() if row[4] else None,
                    'created_at': row[5].isoformat() if row[5] else None,
                    'is_online': row[6]
                })
    return users

def get_user_leads(user_id: int) -> List[Dict[str, Any]]:
    """Получить лиды конкретного пользователя"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, notes, audio_data, created_at 
                FROM t_p24058207_website_creation_pro.leads 
                WHERE user_id = %s 
                ORDER BY created_at DESC
            """, (user_id,))
            
            leads = []
            for row in cur.fetchall():
                leads.append({
                    'id': row[0],
                    'notes': row[1] or '',
                    'audio_data': row[2],
                    'created_at': get_moscow_time_from_utc(row[3]).isoformat() if row[3] else None
                })
            return leads

def get_moscow_time_from_utc(utc_time):
    """Конвертировать UTC время в московское"""
    if utc_time.tzinfo is None:
        utc_time = utc_time.replace(tzinfo=pytz.UTC)
    return utc_time.astimezone(MOSCOW_TZ)

def get_leads_stats() -> Dict[str, Any]:
    """Получить статистику по лидам"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Общая статистика
            cur.execute("SELECT COUNT(*) FROM t_p24058207_website_creation_pro.leads")
            total_leads = cur.fetchone()[0]
            
            # Лиды по пользователям
            cur.execute("""
                SELECT u.name, u.email, COUNT(l.id) as lead_count
                FROM t_p24058207_website_creation_pro.users u 
                LEFT JOIN t_p24058207_website_creation_pro.leads l ON u.id = l.user_id
                GROUP BY u.id, u.name, u.email
                ORDER BY lead_count DESC
            """)
            
            user_stats = []
            for row in cur.fetchall():
                user_stats.append({
                    'name': row[0],
                    'email': row[1], 
                    'lead_count': row[2]
                })
            
            # Лиды за последние дни
            cur.execute("""
                SELECT DATE(created_at) as date, COUNT(*) as count
                FROM t_p24058207_website_creation_pro.leads 
                WHERE created_at >= %s
                GROUP BY DATE(created_at)
                ORDER BY date DESC
            """, (get_moscow_time() - timedelta(days=30),))
            
            daily_stats = []
            for row in cur.fetchall():
                daily_stats.append({
                    'date': row[0].isoformat(),
                    'count': row[1]
                })
    
    return {
        'total_leads': total_leads,
        'user_stats': user_stats,
        'daily_stats': daily_stats
    }

def get_user_leads(user_id: int) -> List[Dict[str, Any]]:
    """Получить все лиды пользователя"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, user_id, notes, has_audio, audio_data, created_at
                FROM t_p24058207_website_creation_pro.leads 
                WHERE user_id = %s
                ORDER BY created_at DESC
            """, (user_id,))
            
            leads = []
            for row in cur.fetchall():
                lead = {
                    'id': row[0],
                    'user_id': row[1],
                    'notes': row[2],
                    'has_audio': row[3],
                    'audio_data': row[4],
                    'created_at': row[5].isoformat() if row[5] else None
                }
                leads.append(lead)
            
            return leads

def update_user_name(user_id: int, new_name: str) -> bool:
    """Обновить имя пользователя"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE t_p24058207_website_creation_pro.users SET name = %s WHERE id = %s",
                (new_name, user_id)
            )
            conn.commit()
            return cur.rowcount > 0

def delete_user(user_id: int) -> bool:
    """Удалить пользователя и все связанные данные"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Сначала удаляем сессии пользователя
            cur.execute("DELETE FROM t_p24058207_website_creation_pro.user_sessions WHERE user_id = %s", (user_id,))
            # Потом удаляем лиды пользователя
            cur.execute("DELETE FROM t_p24058207_website_creation_pro.leads WHERE user_id = %s", (user_id,))
            # И наконец удаляем самого пользователя (только не админов)
            cur.execute("DELETE FROM t_p24058207_website_creation_pro.users WHERE id = %s AND is_admin = FALSE", (user_id,))
            conn.commit()
            return cur.rowcount > 0

def delete_lead(lead_id: int) -> bool:
    """Удалить лид по ID"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM t_p24058207_website_creation_pro.leads WHERE id = %s", (lead_id,))
            conn.commit()
            return cur.rowcount > 0

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

    # Проверка авторизации
    session_token = event.get('headers', {}).get('X-Session-Token')
    if not session_token:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Требуется авторизация'})
        }

    user = get_user_by_session(session_token)
    if not user or not user['is_admin']:
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({'error': 'Доступ запрещен'})
        }

    if method == 'GET':
        action = event.get('queryStringParameters', {}).get('action', '')
        
        if action == 'users':
            users = get_all_users()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'users': users})
            }
        
        elif action == 'stats':
            stats = get_leads_stats()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(stats)
            }
        
        elif action == 'user_leads':
            user_id = event.get('queryStringParameters', {}).get('user_id')
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Требуется user_id'})
                }
            
            try:
                user_id = int(user_id)
                leads = get_user_leads(user_id)
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'leads': leads})
                }
            except ValueError:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Неверный user_id'})
                }
    
    elif method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'update_user':
            user_id = body_data.get('user_id')
            new_name = body_data.get('name', '').strip()
            
            if not user_id or not new_name:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'ID пользователя и имя обязательны'})
                }
            
            success = update_user_name(user_id, new_name)
            if success:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True})
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Пользователь не найден'})
                }
    
    elif method == 'DELETE':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'delete_user':
            user_id = body_data.get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'ID пользователя обязателен'})
                }
            
            success = delete_user(user_id)
            if success:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True})
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Пользователь не найден или является администратором'})
                }
    
    elif method == 'DELETE':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'delete_lead':
            lead_id = body_data.get('lead_id')
            
            if not lead_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'ID лида обязателен'})
                }
            
            success = delete_lead(lead_id)
            if success:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True})
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Лид не найден'})
                }

    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'Метод не поддерживается'})
    }