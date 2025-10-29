import json
import os
from datetime import datetime
from typing import Dict, Any
import psycopg2
from psycopg2.extras import RealDictCursor

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Get today and month earnings from KMS column
    Args: event - dict with headers containing X-Session-Token
          context - object with request_id attribute
    Returns: HTTP response with today and month earnings
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
    
    headers = event.get('headers', {})
    session_token = headers.get('X-Session-Token') or headers.get('x-session-token')
    
    if not session_token:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Database not configured'})
        }
    
    conn = psycopg2.connect(database_url)
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    session_token_escaped = session_token.replace("'", "''")
    cursor.execute(
        f"SELECT is_admin FROM users WHERE session_token = '{session_token_escaped}'"
    )
    user = cursor.fetchone()
    
    if not user or not user['is_admin']:
        cursor.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Access denied'})
        }
    
    now = datetime.now()
    today_str = now.strftime('%Y-%m-%d')
    month_start = now.strftime('%Y-%m-01')
    
    cursor.execute(
        f"SELECT COALESCE(SUM(CAST(kms AS INTEGER)), 0) as total FROM work_time WHERE work_date = '{today_str}'"
    )
    today_result = cursor.fetchone()
    today_earnings = today_result['total'] if today_result else 0
    
    cursor.execute(
        f"SELECT COALESCE(SUM(CAST(kms AS INTEGER)), 0) as total FROM work_time WHERE work_date >= '{month_start}' AND work_date < (DATE '{month_start}' + INTERVAL '1 month')"
    )
    month_result = cursor.fetchone()
    month_earnings = month_result['total'] if month_result else 0
    
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'today': today_earnings,
            'month': month_earnings
        })
    }