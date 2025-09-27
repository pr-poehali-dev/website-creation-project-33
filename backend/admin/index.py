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
    return datetime.now(MOSCOW_TZ)

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
                FROM users u 
                JOIN user_sessions s ON u.id = s.user_id 
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
                FROM users u 
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

def get_leads_stats() -> Dict[str, Any]:
    """Получить статистику по лидам"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Общая статистика
            cur.execute("SELECT COUNT(*) FROM leads")
            total_leads = cur.fetchone()[0]
            
            # Лиды по пользователям
            cur.execute("""
                SELECT u.name, u.email, COUNT(l.id) as lead_count
                FROM users u 
                LEFT JOIN leads l ON u.id = l.user_id
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
                FROM leads 
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

def update_user_name(user_id: int, new_name: str) -> bool:
    """Обновить имя пользователя"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE users SET name = %s WHERE id = %s",
                (new_name, user_id)
            )
            conn.commit()
            return cur.rowcount > 0

def delete_user(user_id: int) -> bool:
    """Удалить пользователя и все связанные данные"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Сначала удаляем сессии пользователя
            cur.execute("DELETE FROM user_sessions WHERE user_id = %s", (user_id,))
            # Потом удаляем лиды пользователя
            cur.execute("DELETE FROM leads WHERE user_id = %s", (user_id,))
            # И наконец удаляем самого пользователя (только не админов)
            cur.execute("DELETE FROM users WHERE id = %s AND is_admin = FALSE", (user_id,))
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

    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'Метод не поддерживается'})
    }