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
                'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
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
        get_shifts = params.get('get_shifts', 'false').lower() == 'true'
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'user_id required'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Get work shifts from admin if requested
        work_shifts = []
        if get_shifts:
            if week_start:
                # Get shifts for specific week (7 days from week_start)
                week_end_date = (datetime.strptime(week_start, '%Y-%m-%d') + timedelta(days=6)).strftime('%Y-%m-%d')
                cur.execute("""
                    SELECT ws.shift_date, ws.shift_start, ws.shift_end, o.name, o.id
                    FROM t_p24058207_website_creation_pro.work_shifts ws
                    JOIN t_p24058207_website_creation_pro.organizations o ON ws.organization_id = o.id
                    WHERE ws.user_id = %s AND ws.shift_date >= %s AND ws.shift_date <= %s
                    ORDER BY ws.shift_date, ws.shift_start
                """, (int(user_id), week_start, week_end_date))
            else:
                # Get all future shifts
                cur.execute("""
                    SELECT ws.shift_date, ws.shift_start, ws.shift_end, o.name, o.id
                    FROM t_p24058207_website_creation_pro.work_shifts ws
                    JOIN t_p24058207_website_creation_pro.organizations o ON ws.organization_id = o.id
                    WHERE ws.user_id = %s AND ws.shift_date >= CURRENT_DATE
                    ORDER BY ws.shift_date, ws.shift_start
                """, (int(user_id),))
            
            for shift_row in cur.fetchall():
                work_shifts.append({
                    'date': shift_row[0].isoformat() if shift_row[0] else None,
                    'start_time': shift_row[1].isoformat() if shift_row[1] else None,
                    'end_time': shift_row[2].isoformat() if shift_row[2] else None,
                    'organization_name': shift_row[3],
                    'organization_id': shift_row[4]
                })
        
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
                    'week_start_date': row[1].isoformat(),
                    'work_shifts': work_shifts
                })
            }
        else:
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'schedule': None, 'work_shifts': work_shifts})
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
        
        # Получаем графики промоутеров
        cur.execute("""
            SELECT u.id, COALESCE(ps.schedule_data, '{}'::jsonb), %s, u.name, u.email
            FROM t_p24058207_website_creation_pro.users u
            LEFT JOIN t_p24058207_website_creation_pro.promoter_schedules ps 
                ON u.id = ps.user_id AND ps.week_start_date = %s
            WHERE u.is_active = true AND u.is_approved = true
            ORDER BY u.name
        """, (week_start, week_start))
        
        rows = cur.fetchall()
        
        # Получаем статистику (avg_per_shift) для всех промоутеров одним запросом
        cur.execute("""
            SELECT 
                u.id as user_id,
                CASE 
                    WHEN COUNT(DISTINCT DATE(la.created_at)) > 0 
                    THEN ROUND(COUNT(la.id)::numeric / COUNT(DISTINCT DATE(la.created_at)), 1)
                    ELSE 0
                END as avg_per_shift
            FROM t_p24058207_website_creation_pro.users u
            LEFT JOIN t_p24058207_website_creation_pro.leads_analytics la 
                ON u.id = la.user_id 
                AND la.lead_type = 'контакт' 
                AND la.is_active = true
            WHERE u.is_admin = false AND u.is_active = true AND u.is_approved = true
            GROUP BY u.id
        """)
        
        stats_rows = cur.fetchall()
        stats_map = {row[0]: float(row[1]) if row[1] else 0 for row in stats_rows}
        
        # Получаем фактические контакты за неделю (для сравнения с прогнозом)
        week_end_date = (datetime.strptime(week_start, '%Y-%m-%d') + timedelta(days=6)).strftime('%Y-%m-%d')
        cur.execute("""
            SELECT 
                DATE(created_at) as date,
                COUNT(id) as count
            FROM t_p24058207_website_creation_pro.leads_analytics
            WHERE DATE(created_at) >= %s 
                AND DATE(created_at) <= %s
                AND lead_type = 'контакт'
                AND is_active = true
            GROUP BY DATE(created_at)
        """, (week_start, week_end_date))
        
        actual_rows = cur.fetchall()
        actual_map = {row[0].isoformat(): row[1] for row in actual_rows}
        
        cur.close()
        conn.close()
        
        schedules = []
        for row in rows:
            user_id = row[0]
            schedules.append({
                'user_id': user_id,
                'schedule': row[1],
                'week_start_date': row[2],
                'first_name': row[3].split()[0] if row[3] else 'User',
                'last_name': row[3].split()[1] if row[3] and len(row[3].split()) > 1 else '',
                'email': row[4],
                'avg_per_shift': stats_map.get(user_id, 0)
            })
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({
                'schedules': schedules,
                'actual_contacts': actual_map
            })
        }
    
    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'Method not allowed'})
    }