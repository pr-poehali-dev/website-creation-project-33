'''
Экспорт данных блокнота в CSV формате с русской кодировкой
Args: event с httpMethod, headers; context с request_id
Returns: CSV файл с данными всех пользователей
'''

import json
import os
import csv
import io
import base64
import psycopg2
from datetime import datetime
from typing import Dict, Any, List

def get_db_connection():
    """Получить подключение к базе данных"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise Exception('DATABASE_URL not found in environment')
    return psycopg2.connect(database_url)

def get_user_by_session(session_token: str) -> Dict[str, Any]:
    """Получить пользователя по токену сессии"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.id, u.email, u.name, u.is_admin 
                FROM users u 
                JOIN user_sessions s ON u.id = s.user_id 
                WHERE s.session_token = %s AND s.expires_at > %s
            """, (session_token, datetime.now()))
            
            row = cur.fetchone()
            if row:
                return {
                    'id': row[0],
                    'email': row[1], 
                    'name': row[2],
                    'is_admin': row[3]
                }
    return None

def get_leads_data() -> List[Dict[str, Any]]:
    """Получить все данные лидов с информацией о пользователях"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.name, u.email, l.notes, l.has_audio, l.created_at
                FROM leads l
                JOIN users u ON l.user_id = u.id
                WHERE l.notes IS NOT NULL AND l.notes != ''
                ORDER BY l.created_at DESC
            """)
            
            leads = []
            for row in cur.fetchall():
                leads.append({
                    'user_name': row[0],
                    'user_email': row[1],
                    'notes': row[2],
                    'has_audio': row[3],
                    'created_at': row[4]
                })
    return leads

def create_csv_content(leads_data: List[Dict[str, Any]]) -> str:
    """Создать CSV контент с русской кодировкой"""
    output = io.StringIO()
    
    # Используем CSV writer с правильным разделителем для Excel
    writer = csv.writer(output, delimiter=';', quoting=csv.QUOTE_ALL)
    
    # Заголовки
    writer.writerow([
        'Имя пользователя',
        'Email',
        'Комментарий из блокнота', 
        'Есть аудио',
        'Дата создания'
    ])
    
    # Данные
    for lead in leads_data:
        writer.writerow([
            lead['user_name'],
            lead['user_email'],
            lead['notes'],
            'Да' if lead['has_audio'] else 'Нет',
            lead['created_at'].strftime('%d.%m.%Y %H:%M:%S') if lead['created_at'] else ''
        ])
    
    csv_content = output.getvalue()
    output.close()
    
    # Кодируем в UTF-8 с BOM для корректного отображения в Excel
    csv_bytes = '\ufeff'.encode('utf-8') + csv_content.encode('utf-8')
    return base64.b64encode(csv_bytes).decode('utf-8')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    headers = {
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
        try:
            leads_data = get_leads_data()
            csv_base64 = create_csv_content(leads_data)
            
            # Генерируем имя файла с датой
            filename = f"leads_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/csv; charset=utf-8',
                    'Content-Disposition': f'attachment; filename="{filename}"',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Expose-Headers': 'Content-Disposition'
                },
                'isBase64Encoded': True,
                'body': csv_base64
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': f'Ошибка экспорта: {str(e)}'})
            }

    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'Метод не поддерживается'})
    }