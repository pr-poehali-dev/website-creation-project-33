import json
import os
import psycopg2
from datetime import datetime, timedelta
from typing import Any, Dict

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Получение детализации смен промоутера в организации
    Args: event - dict с httpMethod, queryStringParameters, headers
          context - объект с атрибутами request_id, function_name
    Returns: HTTP response dict с данными о сменах
    '''
    
    method: str = event.get('httpMethod', 'GET')
    
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
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters') or {}
    promoter_name = params.get('promoter_name')
    organization_name = params.get('organization_name')
    time_range = params.get('time_range', 'week')
    
    if not promoter_name or not organization_name:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'promoter_name and organization_name required'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Database connection not configured'})
        }
    
    try:
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        start_date, end_date = calculate_date_range(time_range, params)
        
        query = '''
            SELECT 
                DATE(l.created_at + interval '3 hours') as shift_date,
                COUNT(CASE WHEN l.lead_type = 'контакт' THEN 1 END) as contacts
            FROM t_p24058207_website_creation_pro.leads_analytics l
            JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
            JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
            WHERE u.name = %s
                AND o.name = %s
                AND l.is_active = true
                AND DATE(l.created_at + interval '3 hours') >= %s
                AND DATE(l.created_at + interval '3 hours') <= %s
            GROUP BY shift_date
            HAVING COUNT(CASE WHEN l.lead_type = 'контакт' THEN 1 END) > 0
            ORDER BY shift_date DESC
        '''
        
        cur.execute(query, (promoter_name, organization_name, start_date, end_date))
        rows = cur.fetchall()
        
        shifts = [
            {
                'date': row[0].isoformat() if hasattr(row[0], 'isoformat') else str(row[0]),
                'contacts': int(row[1] or 0)
            }
            for row in rows
        ]
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'shifts': shifts,
                'promoter_name': promoter_name,
                'organization_name': organization_name
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }


def calculate_date_range(time_range: str, params: Dict[str, str]) -> tuple:
    '''Вычисляет диапазон дат на основе выбранного периода'''
    now = datetime.now()
    
    if time_range == 'week':
        week_index = int(params.get('week_index', 0))
        current_day_of_week = now.weekday()
        
        this_monday = now - timedelta(days=current_day_of_week)
        this_monday = this_monday.replace(hour=0, minute=0, second=0)
        
        week_start = this_monday - timedelta(weeks=week_index)
        week_end = week_start + timedelta(days=6)
        week_end = week_end.replace(hour=23, minute=59, second=59)
        
        return week_start.date(), week_end.date()
    
    elif time_range == 'month':
        month_index = int(params.get('month_index', 0))
        target_month = now.month - month_index
        target_year = now.year
        
        while target_month < 1:
            target_month += 12
            target_year -= 1
        
        month_start = datetime(target_year, target_month, 1)
        
        if target_month == 12:
            month_end = datetime(target_year + 1, 1, 1) - timedelta(days=1)
        else:
            month_end = datetime(target_year, target_month + 1, 1) - timedelta(days=1)
        
        return month_start.date(), month_end.date()
    
    elif time_range == 'year':
        year = int(params.get('year', now.year))
        year_start = datetime(year, 1, 1)
        year_end = datetime(year, 12, 31)
        
        return year_start.date(), year_end.date()
    
    return now.date(), now.date()