import json
import os
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def get_db_connection():
    '''Create database connection'''
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Handle chat messages between users and admin
    Args: event - dict with httpMethod, body, headers (X-User-Id)
    Returns: HTTP response with messages or success status
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('X-User-Id') or headers.get('x-user-id')
    
    if not user_id:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # Проверяем, существует ли пользователь и является ли он администратором
        cursor.execute("SELECT id, is_admin FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'User not found'})
            }
        
        is_admin = user['is_admin']
        
        if method == 'GET':
            # Получение сообщений
            query_params = event.get('queryStringParameters') or {}
            target_user_id = query_params.get('user_id')
            
            if is_admin and target_user_id:
                # Админ получает сообщения конкретного пользователя
                cursor.execute("""
                    SELECT cm.*, u.name as user_name
                    FROM chat_messages cm
                    JOIN users u ON cm.user_id = u.id
                    WHERE cm.user_id = %s
                    ORDER BY cm.created_at ASC
                """, (target_user_id,))
                
                messages = cursor.fetchall()
                
                # Отмечаем сообщения от пользователя как прочитанные
                cursor.execute("""
                    UPDATE chat_messages 
                    SET is_read = TRUE 
                    WHERE user_id = %s AND is_from_admin = FALSE AND is_read = FALSE
                """, (target_user_id,))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'messages': [dict(row) for row in messages]
                    }, default=str)
                }
                
            elif is_admin:
                # Админ получает список пользователей, у которых есть сообщения
                cursor.execute("""
                    SELECT 
                        u.id,
                        u.name,
                        u.email,
                        COALESCE(COUNT(CASE WHEN cm.is_read = FALSE AND cm.is_from_admin = FALSE THEN 1 END), 0) as unread_count,
                        MAX(cm.created_at) as last_message_time
                    FROM chat_messages cm
                    JOIN users u ON cm.user_id = u.id
                    WHERE u.is_admin = FALSE
                    GROUP BY u.id, u.name, u.email
                    ORDER BY MAX(cm.created_at) DESC
                """)
                
                users_list = cursor.fetchall()
                messages = []
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'users': [dict(row) for row in users_list],
                        'messages': messages
                    }, default=str)
                }
            else:
                # Обычный пользователь получает свои сообщения
                cursor.execute("""
                    SELECT cm.*, u.name as user_name
                    FROM chat_messages cm
                    JOIN users u ON cm.user_id = u.id
                    WHERE cm.user_id = %s
                    ORDER BY cm.created_at ASC
                """, (user_id,))
                
                messages = cursor.fetchall()
                
                # Отмечаем сообщения от админа как прочитанные
                cursor.execute("""
                    UPDATE chat_messages 
                    SET is_read = TRUE 
                    WHERE user_id = %s AND is_from_admin = TRUE AND is_read = FALSE
                """, (user_id,))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'messages': [dict(row) for row in messages]
                    }, default=str)
                }
        
        elif method == 'POST':
            # Отправка сообщения
            body_data = json.loads(event.get('body', '{}'))
            message = body_data.get('message', '').strip()
            target_user_id = body_data.get('user_id')  # Только для админа
            
            if not message:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Message is required'})
                }
            
            if is_admin and target_user_id:
                # Админ отправляет сообщение пользователю
                cursor.execute("""
                    INSERT INTO chat_messages (user_id, message, is_from_admin)
                    VALUES (%s, %s, TRUE)
                    RETURNING id, created_at
                """, (target_user_id, message))
            else:
                # Пользователь отправляет сообщение админу
                cursor.execute("""
                    INSERT INTO chat_messages (user_id, message, is_from_admin)
                    VALUES (%s, %s, FALSE)
                    RETURNING id, created_at
                """, (user_id, message))
            
            result = cursor.fetchone()
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'message_id': result['id'],
                    'created_at': result['created_at'].isoformat()
                })
            }
        
        elif method == 'PUT':
            # Отметить сообщения как прочитанные
            if is_admin:
                query_params = event.get('queryStringParameters') or {}
                target_user_id = query_params.get('user_id')
                
                if target_user_id:
                    cursor.execute("""
                        UPDATE chat_messages 
                        SET is_read = TRUE 
                        WHERE user_id = %s AND is_from_admin = FALSE
                    """, (target_user_id,))
            else:
                cursor.execute("""
                    UPDATE chat_messages 
                    SET is_read = TRUE 
                    WHERE user_id = %s AND is_from_admin = TRUE
                """, (user_id,))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
        
    except Exception as e:
        conn.rollback()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
    finally:
        cursor.close()
        conn.close()