'''
Экспорт контактов (лидов с номерами телефонов) в CSV формате с русской кодировкой
Args: event с httpMethod, headers; context с request_id
Returns: CSV файл только с контактами (лиды содержащие номера телефонов)
'''

import json
import os
import csv
import io
import base64
import psycopg2
from datetime import datetime
from typing import Dict, Any, List
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

def get_user_by_session(session_token: str) -> Dict[str, Any]:
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

def get_leads_data(today_only: bool = False) -> List[Dict[str, Any]]:
    """Получить только контакты (лиды с номерами телефонов)"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            if today_only:
                # Получаем начало и конец сегодняшнего дня в московском времени
                moscow_now = get_moscow_time()
                moscow_today_start = moscow_now.replace(hour=0, minute=0, second=0, microsecond=0)
                moscow_today_end = moscow_now.replace(hour=23, minute=59, second=59, microsecond=999999)
                
                # Конвертируем московское время в UTC для сравнения с данными в БД
                utc_today_start = moscow_today_start.astimezone(pytz.UTC).replace(tzinfo=None)
                utc_today_end = moscow_today_end.astimezone(pytz.UTC).replace(tzinfo=None)
                
                # Запрос с фильтрацией по сегодняшней дате (UTC границы московского дня)
                query = """
                    SELECT u.name, u.email, l.notes, l.has_audio, l.created_at
                    FROM leads l
                    JOIN users u ON l.user_id = u.id
                    WHERE l.notes IS NOT NULL AND l.notes != ''
                    AND l.notes ~ '([0-9]{11}|\\+7[0-9]{10}|8[0-9]{10}|9[0-9]{9})'
                    AND l.created_at >= %s AND l.created_at <= %s
                    ORDER BY l.created_at DESC
                """
                cur.execute(query, (utc_today_start, utc_today_end))
            else:
                # Запрос для всех лидов с телефонами
                query = """
                    SELECT u.name, u.email, l.notes, l.has_audio, l.created_at
                    FROM leads l
                    JOIN users u ON l.user_id = u.id
                    WHERE l.notes IS NOT NULL AND l.notes != ''
                    AND l.notes ~ '([0-9]{11}|\\+7[0-9]{10}|8[0-9]{10}|9[0-9]{9})'
                    ORDER BY l.created_at DESC
                """
                cur.execute(query)
            
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
        'Контактная информация', 
        'Есть аудио',
        'Дата создания'
    ])
    
    # Данные
    for lead in leads_data:
        # Конвертируем время в московское если оно в UTC
        created_at_moscow = lead['created_at']
        if created_at_moscow and created_at_moscow.tzinfo is None:
            # Если время без зоны, считаем что это UTC и конвертируем в московское
            created_at_moscow = pytz.UTC.localize(created_at_moscow).astimezone(MOSCOW_TZ)
        elif created_at_moscow and created_at_moscow.tzinfo:
            # Если время уже с зоной, конвертируем в московское
            created_at_moscow = created_at_moscow.astimezone(MOSCOW_TZ)
            
        writer.writerow([
            lead['user_name'],
            lead['user_email'],
            lead['notes'],
            'Да' if lead['has_audio'] else 'Нет',
            created_at_moscow.strftime('%d.%m.%Y %H:%M:%S МСК') if created_at_moscow else ''
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
            # Проверяем параметр today для фильтрации по сегодняшнему дню
            query_params = event.get('queryStringParameters') or {}
            today_only = query_params.get('today') == 'true'
            
            print(f'Export request: today_only={today_only}, query_params={query_params}')
            
            leads_data = get_leads_data(today_only=today_only)
            print(f'Found {len(leads_data)} leads')
            
            csv_base64 = create_csv_content(leads_data)
            
            # Генерируем имя файла с московской датой
            file_prefix = "contacts_today" if today_only else "contacts_all"
            filename = f"{file_prefix}_{get_moscow_time().strftime('%Y%m%d_%H%M%S')}.csv"
            
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
            import traceback
            error_details = traceback.format_exc()
            print(f'Error in export: {error_details}')
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