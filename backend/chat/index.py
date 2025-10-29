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
    Business: Handle chat messages, read status, and typing indicators
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
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
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
        cursor.execute("SELECT id, is_admin FROM t_p24058207_website_creation_pro.users WHERE id = %s", (user_id,))
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
                    FROM t_p24058207_website_creation_pro.chat_messages cm
                    JOIN t_p24058207_website_creation_pro.users u ON cm.user_id = u.id
                    WHERE cm.user_id = %s
                    ORDER BY cm.created_at ASC
                """, (target_user_id,))
                
                messages = cursor.fetchall()
                
                # Отмечаем сообщения от пользователя как прочитанные
                cursor.execute("""
                    UPDATE t_p24058207_website_creation_pro.chat_messages 
                    SET is_read = TRUE 
                    WHERE user_id = %s AND is_from_admin = FALSE AND is_read = FALSE
                """, (target_user_id,))
                conn.commit()
                
                # Получаем статус печатает
                cursor.execute("""
                    SELECT is_typing FROM t_p24058207_website_creation_pro.typing_status 
                    WHERE user_id = %s
                """, (target_user_id,))
                typing_row = cursor.fetchone()
                is_typing = typing_row['is_typing'] if typing_row else False
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'messages': [dict(row) for row in messages],
                        'is_typing': is_typing
                    }, default=str)
                }
                
            elif is_admin:
                # Админ получает список активных пользователей
                cursor.execute("""
                    SELECT 
                        u.id,
                        u.name,
                        u.email,
                        COALESCE(COUNT(CASE WHEN cm.is_read = FALSE AND cm.is_from_admin = FALSE THEN 1 END), 0) as unread_count,
                        MAX(cm.created_at) as last_message_time,
                        COALESCE(COUNT(cm.id), 0) as total_messages
                    FROM t_p24058207_website_creation_pro.users u
                    LEFT JOIN t_p24058207_website_creation_pro.chat_messages cm ON u.id = cm.user_id
                    WHERE u.is_admin = FALSE AND u.is_active = TRUE
                    GROUP BY u.id, u.name, u.email
                    ORDER BY MAX(cm.created_at) DESC NULLS LAST, u.name ASC
                """)
                
                users_list = cursor.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'users': [dict(row) for row in users_list]
                    }, default=str)
                }
            else:
                # Обычный пользователь получает свои сообщения
                query_params = event.get('queryStringParameters') or {}
                mark_read = query_params.get('mark_read') == 'true'
                
                cursor.execute("""
                    SELECT cm.*, u.name as user_name
                    FROM t_p24058207_website_creation_pro.chat_messages cm
                    JOIN t_p24058207_website_creation_pro.users u ON cm.user_id = u.id
                    WHERE cm.user_id = %s
                    ORDER BY cm.created_at ASC
                """, (user_id,))
                
                messages = cursor.fetchall()
                
                # Отмечаем сообщения от админа как прочитанные только если явно запросили
                if mark_read:
                    cursor.execute("""
                        UPDATE t_p24058207_website_creation_pro.chat_messages 
                        SET is_read = TRUE 
                        WHERE user_id = %s AND is_from_admin = TRUE AND is_read = FALSE
                    """, (user_id,))
                    conn.commit()
                
                # Получаем статус печатает для админа (user_id = 1 - админ)
                cursor.execute("""
                    SELECT is_typing FROM t_p24058207_website_creation_pro.typing_status 
                    WHERE user_id = 1
                """)
                typing_row = cursor.fetchone()
                admin_typing = typing_row['is_typing'] if typing_row else False
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'messages': [dict(row) for row in messages],
                        'is_typing': admin_typing
                    }, default=str)
                }
        
        elif method == 'POST':
            # Отправка сообщения (с поддержкой медиафайлов через base64)
            body_data = json.loads(event.get('body', '{}'))
            message = body_data.get('message', '').strip()
            target_user_id = body_data.get('user_id')  # Только для админа
            media_type = body_data.get('media_type')  # audio, image, video
            media_data = body_data.get('media_data')  # base64 encoded
            
            # Сообщение или медиа обязательно
            if not message and not media_data:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Message or media is required'})
                }
            
            # Формируем медиа URL (data URI для встраивания)
            media_url = None
            if media_data and media_type:
                if media_type == 'audio':
                    media_url = f'data:audio/webm;base64,{media_data}'
                elif media_type == 'image':
                    media_url = f'data:image/jpeg;base64,{media_data}'
                elif media_type == 'video':
                    media_url = f'data:video/mp4;base64,{media_data}'
            
            if is_admin and target_user_id:
                # Админ отправляет сообщение пользователю
                cursor.execute("""
                    INSERT INTO t_p24058207_website_creation_pro.chat_messages (user_id, message, is_from_admin, media_type, media_url)
                    VALUES (%s, %s, TRUE, %s, %s)
                    RETURNING id, created_at
                """, (target_user_id, message or '', media_type, media_url))
            else:
                # Пользователь отправляет сообщение админу
                cursor.execute("""
                    INSERT INTO t_p24058207_website_creation_pro.chat_messages (user_id, message, is_from_admin, media_type, media_url)
                    VALUES (%s, %s, FALSE, %s, %s)
                    RETURNING id, created_at
                """, (user_id, message or '', media_type, media_url))
            
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
                        UPDATE t_p24058207_website_creation_pro.chat_messages 
                        SET is_read = TRUE 
                        WHERE user_id = %s AND is_from_admin = FALSE
                    """, (target_user_id,))
            else:
                cursor.execute("""
                    UPDATE t_p24058207_website_creation_pro.chat_messages 
                    SET is_read = TRUE 
                    WHERE user_id = %s AND is_from_admin = TRUE
                """, (user_id,))
            
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
        
        elif method == 'PATCH':
            # Обновить статус печатает
            body_data = json.loads(event.get('body', '{}'))
            is_typing = body_data.get('is_typing', False)
            
            cursor.execute("""
                INSERT INTO t_p24058207_website_creation_pro.typing_status (user_id, is_typing, updated_at)
                VALUES (%s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (user_id) DO UPDATE SET is_typing = %s, updated_at = CURRENT_TIMESTAMP
            """, (user_id, is_typing, is_typing))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
        
        elif method == 'DELETE':
            # Очистка чата (только для админа)
            if not is_admin:
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Forbidden'})
                }
            
            query_params = event.get('queryStringParameters') or {}
            target_user_id = query_params.get('user_id')
            
            if not target_user_id:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_id is required'})
                }
            
            # Удаляем ВСЕ сообщения пользователя НАВСЕГДА (включая медиа base64)
            # Аудио/фото/видео хранятся как base64 в media_url
            # После DELETE они исчезают из БД физически и навсегда
            cursor.execute("""
                DELETE FROM t_p24058207_website_creation_pro.chat_messages WHERE user_id = %s
            """, (target_user_id,))
            
            deleted_count = cursor.rowcount
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({
                    'success': True,
                    'deleted_count': deleted_count
                })
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