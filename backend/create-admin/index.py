'''
Создание админа с правильным хешем пароля
Args: event с httpMethod; context с request_id
Returns: JSON с результатом создания
'''

import json
import os
import bcrypt
import psycopg2
from typing import Dict, Any

def get_db_connection():
    """Получить подключение к базе данных"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise Exception('DATABASE_URL not found in environment')
    return psycopg2.connect(database_url)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }

    if method == 'POST':
        # Create proper bcrypt hash for 'admin' password
        password = 'admin'
        salt = bcrypt.gensalt()
        password_hash = bcrypt.hashpw(password.encode('utf-8'), salt).decode('utf-8')
        
        try:
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    # Update existing admin or insert new one
                    cur.execute("""
                        UPDATE users 
                        SET password_hash = %s, name = %s, is_admin = %s 
                        WHERE email = %s
                    """, (password_hash, 'Administrator', True, 'admin@gmail.com'))
                    
                    if cur.rowcount == 0:
                        # If no admin exists, create one
                        cur.execute("""
                            INSERT INTO users (email, password_hash, name, is_admin) 
                            VALUES (%s, %s, %s, %s)
                        """, ('admin@gmail.com', password_hash, 'Administrator', True))
                    
                    conn.commit()
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'message': 'Admin created/updated successfully',
                    'hash': password_hash
                })
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': f'Database error: {str(e)}'})
            }
    
    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'Метод не поддерживается'})
    }