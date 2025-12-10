import json
import os
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event, context):
    '''
    Загружает данные о выходах промоутеров по организациям за выбранный период
    
    Args:
        event: HTTP запрос с параметрами start_date, end_date
        context: контекст выполнения функции
    
    Returns:
        JSON с организациями и их статусом выходов, отсортированными по давности
    '''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    query_params = event.get('queryStringParameters') or {}
    start_date = query_params.get('start_date')
    end_date = query_params.get('end_date')
    
    if not start_date or not end_date:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'start_date and end_date are required'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ['DATABASE_URL']
    conn = psycopg2.connect(dsn)
    
    try:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute('''
                SELECT 
                    o.id,
                    o.name,
                    o.is_active,
                    MAX(ws.shift_date) as last_shift_date,
                    CASE 
                        WHEN MAX(ws.shift_date) IS NOT NULL 
                        THEN CURRENT_DATE - MAX(ws.shift_date)
                        ELSE NULL 
                    END as days_since_last_shift,
                    EXISTS(
                        SELECT 1 
                        FROM t_p24058207_website_creation_pro.work_shifts ws2 
                        WHERE ws2.organization_id = o.id 
                        AND ws2.shift_date >= %s 
                        AND ws2.shift_date <= %s
                    ) as has_shift_in_period
                FROM t_p24058207_website_creation_pro.organizations o
                LEFT JOIN t_p24058207_website_creation_pro.work_shifts ws 
                    ON ws.organization_id = o.id
                WHERE o.is_active = true
                GROUP BY o.id, o.name, o.is_active
                ORDER BY 
                    has_shift_in_period ASC,
                    days_since_last_shift DESC NULLS FIRST,
                    o.name ASC
            ''', (start_date, end_date))
            
            organizations = []
            for row in cur.fetchall():
                organizations.append({
                    'id': row['id'],
                    'name': row['name'],
                    'last_shift_date': row['last_shift_date'].isoformat() if row['last_shift_date'] else None,
                    'days_since_last_shift': row['days_since_last_shift'],
                    'has_shift_in_period': row['has_shift_in_period']
                })
            
            cur.execute('''
                SELECT 
                    ws.id,
                    ws.user_id,
                    u.name as user_name,
                    ws.organization_id,
                    o.name as organization_name,
                    ws.shift_date,
                    ws.shift_start,
                    ws.shift_end
                FROM t_p24058207_website_creation_pro.work_shifts ws
                JOIN t_p24058207_website_creation_pro.users u ON u.id = ws.user_id
                JOIN t_p24058207_website_creation_pro.organizations o ON o.id = ws.organization_id
                WHERE ws.shift_date >= %s 
                  AND ws.shift_date <= %s
                  AND o.is_active = true
                ORDER BY ws.shift_date DESC, ws.shift_start DESC
            ''', (start_date, end_date))
            
            shifts = []
            for row in cur.fetchall():
                shifts.append({
                    'id': row['id'],
                    'user_id': row['user_id'],
                    'user_name': row['user_name'],
                    'organization_id': row['organization_id'],
                    'organization_name': row['organization_name'],
                    'shift_date': row['shift_date'].isoformat(),
                    'shift_start': row['shift_start'].isoformat(),
                    'shift_end': row['shift_end'].isoformat() if row['shift_end'] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'organizations': organizations,
                    'shifts': shifts
                }),
                'isBase64Encoded': False
            }
            
    finally:
        conn.close()
