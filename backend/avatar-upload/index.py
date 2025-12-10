'''
Backend функция для загрузки и управления аватарками пользователей
Загружает изображения в S3, сохраняет URL в базу данных
Args: event с httpMethod, body (base64 изображение), headers
Returns: JSON с avatar_url или ошибкой
'''

import json
import os
import psycopg2
import boto3
import base64
import hashlib
from datetime import datetime
from typing import Dict, Any, Optional

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
                WHERE s.session_token = %s AND s.expires_at > NOW()
            """, (session_token,))
            
            row = cur.fetchone()
            if row:
                return {
                    'id': row[0],
                    'email': row[1], 
                    'name': row[2],
                    'is_admin': row[3]
                }
    return None

def upload_avatar_to_s3(user_id: int, image_data: bytes, content_type: str) -> str:
    """Загрузить аватарку в S3 и вернуть CDN URL"""
    s3 = boto3.client('s3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )
    
    # Генерируем уникальное имя файла
    timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S')
    file_hash = hashlib.md5(image_data).hexdigest()[:8]
    file_extension = 'jpg' if 'jpeg' in content_type or 'jpg' in content_type else 'png'
    key = f'avatars/user_{user_id}_{timestamp}_{file_hash}.{file_extension}'
    
    # Загружаем в S3
    s3.put_object(
        Bucket='files',
        Key=key,
        Body=image_data,
        ContentType=content_type
    )
    
    # Возвращаем CDN URL
    cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"
    return cdn_url

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        # Проверяем авторизацию
        headers_dict = event.get('headers', {})
        session_token = (
            headers_dict.get('X-Session-Token') or 
            headers_dict.get('x-session-token') or
            headers_dict.get('X-SESSION-TOKEN')
        )
        
        if not session_token:
            return {
                'statusCode': 401,
                'headers': headers,
                'body': json.dumps({'error': 'Требуется авторизация'}),
                'isBase64Encoded': False
            }
        
        user = get_user_by_session(session_token)
        
        if not user:
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({'error': 'Доступ запрещен'}),
                'isBase64Encoded': False
            }
        
        if method == 'POST':
            # Загрузка новой аватарки
            body_data = json.loads(event.get('body', '{}'))
            image_base64 = body_data.get('image')
            content_type = body_data.get('content_type', 'image/jpeg')
            
            if not image_base64:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Изображение обязательно'}),
                    'isBase64Encoded': False
                }
            
            # Декодируем base64
            try:
                image_data = base64.b64decode(image_base64)
            except Exception as e:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': f'Неверный формат изображения: {str(e)}'}),
                    'isBase64Encoded': False
                }
            
            # Проверяем размер (макс 5MB)
            if len(image_data) > 5 * 1024 * 1024:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Файл слишком большой (макс 5MB)'}),
                    'isBase64Encoded': False
                }
            
            # Загружаем в S3
            avatar_url = upload_avatar_to_s3(user['id'], image_data, content_type)
            
            # Сохраняем URL в базу
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        UPDATE t_p24058207_website_creation_pro.users 
                        SET avatar_url = %s 
                        WHERE id = %s
                    """, (avatar_url, user['id']))
                    conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'avatar_url': avatar_url
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'DELETE':
            # Удаление аватарки
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        UPDATE t_p24058207_website_creation_pro.users 
                        SET avatar_url = NULL 
                        WHERE id = %s
                    """, (user['id'],))
                    conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'message': 'Аватарка удалена'
                }),
                'isBase64Encoded': False
            }
        
        elif method == 'GET':
            # Получение текущей аватарки
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT avatar_url 
                        FROM t_p24058207_website_creation_pro.users 
                        WHERE id = %s
                    """, (user['id'],))
                    row = cur.fetchone()
                    avatar_url = row[0] if row else None
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'avatar_url': avatar_url
                }),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Метод не поддерживается'}),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Ошибка сервера: {str(e)}'}),
            'isBase64Encoded': False
        }
