'''
Business: Manage promoter work schedules - save and retrieve weekly schedules
Args: event with httpMethod, body, queryStringParameters; context with request_id
Returns: HTTP response with schedule data or success status
'''

import json
import os
import psycopg2
from typing import Dict, Any
from datetime import datetime, timedelta

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    # GET - retrieve schedule for user
    if method == 'GET':
        params = event.get('queryStringParameters', {})
        user_id = params.get('user_id')
        week_start = params.get('week_start')  # format: YYYY-MM-DD
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'user_id required'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        if week_start:
            # Get specific week
            cur.execute(
                "SELECT schedule_data, week_start_date FROM t_p24058207_website_creation_pro.promoter_schedules WHERE user_id = %s AND week_start_date = %s",
                (int(user_id), week_start)
            )
        else:
            # Get current week
            cur.execute(
                "SELECT schedule_data, week_start_date FROM t_p24058207_website_creation_pro.promoter_schedules WHERE user_id = %s ORDER BY week_start_date DESC LIMIT 1",
                (int(user_id),)
            )
        
        row = cur.fetchone()
        cur.close()
        conn.close()
        
        if row:
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'schedule': row[0],
                    'week_start_date': row[1].isoformat()
                })
            }
        else:
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'schedule': None})
            }
    
    # POST - save/update schedule
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        user_id = body_data.get('user_id')
        week_start = body_data.get('week_start_date')
        schedule_data = body_data.get('schedule')
        
        if not user_id or not week_start or not schedule_data:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'user_id, week_start_date, and schedule required'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Upsert schedule
        cur.execute("""
            INSERT INTO t_p24058207_website_creation_pro.promoter_schedules (user_id, week_start_date, schedule_data, updated_at)
            VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
            ON CONFLICT (user_id, week_start_date)
            DO UPDATE SET schedule_data = EXCLUDED.schedule_data, updated_at = CURRENT_TIMESTAMP
        """, (int(user_id), week_start, json.dumps(schedule_data)))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'success': True, 'message': 'Schedule saved'})
        }
    
    # GET all schedules for a week (admin view)
    if method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        week_start = body_data.get('week_start_date')
        
        if not week_start:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'week_start_date required'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT ps.user_id, ps.schedule_data, ps.week_start_date, u.name, u.email
            FROM t_p24058207_website_creation_pro.promoter_schedules ps
            JOIN t_p24058207_website_creation_pro.users u ON ps.user_id = u.id
            WHERE ps.week_start_date = %s
            ORDER BY u.name
        """, (week_start,))
        
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        schedules = []
        for row in rows:
            name_parts = row[3].split() if row[3] else ['User']
            # Максим Корельский записан как "Корельский Максим" (фамилия имя)
            # Остальные как "Имя Фамилия"
            # Проверяем по первому слову
            is_korelsky_maxim = (
                len(name_parts) >= 2 and 
                name_parts[0].lower() == 'корельский' and 
                name_parts[1].lower() == 'максим'
            )
            
            if is_korelsky_maxim:
                # Для Максима: "Корельский Максим" -> first_name=Максим, last_name=Корельский
                first_name = name_parts[1]
                last_name = name_parts[0]
            else:
                # Для всех остальных: "Имя Фамилия"
                first_name = name_parts[0] if name_parts else 'User'
                last_name = name_parts[1] if len(name_parts) > 1 else ''
            
            schedules.append({
                'user_id': row[0],
                'schedule': row[1],
                'week_start_date': row[2].isoformat(),
                'first_name': first_name,
                'last_name': last_name
            })
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'schedules': schedules})
        }
    
    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'Method not allowed'})
    }