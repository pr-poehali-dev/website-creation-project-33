'''
Business: Import historical leads data into archive table
Args: event with httpMethod POST and body containing CSV data
Returns: HTTP response with import status
'''

import json
import os
from typing import Dict, Any, List
from datetime import datetime
import psycopg2
from psycopg2.extras import execute_batch

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL not found')
    return psycopg2.connect(dsn)

def parse_moscow_datetime(date_str: str, time_str: str) -> str:
    '''Parse Moscow datetime and convert to UTC'''
    dt_str = f"{date_str} {time_str}"
    dt = datetime.strptime(dt_str, "%d.%m.%Y %H:%M:%S")
    utc_dt = dt.replace(tzinfo=None)
    return utc_dt.strftime("%Y-%m-%d %H:%M:%S+03:00")

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = event.get('headers', {})
    session_token = headers.get('x-session-token') or headers.get('X-Session-Token')
    
    if not session_token:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized: No session token'})
        }
    
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.is_admin 
                FROM t_p24058207_website_creation_pro.users u
                JOIN t_p24058207_website_creation_pro.user_sessions s ON s.user_id = u.id
                WHERE s.session_token = %s AND s.expires_at > NOW()
            """, (session_token,))
            result = cur.fetchone()
            
            if not result or not result[0]:
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Forbidden: Admin access required'})
                }
    finally:
        pass
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    csv_data: List[Dict[str, Any]] = body_data.get('data', [])
    
    if not csv_data:
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No data provided'})
        }
    
    imported_count = 0
    errors = []
    
    with conn:
        with conn.cursor() as cur:
            for row in csv_data:
                date_time = row.get('datetime', '').strip()
                org_name = row.get('organization', '').strip()
                user_name = row.get('user', '').strip()
                contact_count = int(row.get('count', 1))
                
                if not date_time or not org_name or not user_name:
                    errors.append(f"Skipped row: {row}")
                    continue
                
                parts = date_time.split('\t')
                if len(parts) < 2:
                    errors.append(f"Invalid datetime format: {date_time}")
                    continue
                
                date_part = parts[0].strip()
                time_part = parts[1].strip()
                
                try:
                    created_at = parse_moscow_datetime(date_part, time_part)
                    
                    cur.execute("""
                        SELECT id FROM t_p24058207_website_creation_pro.organizations 
                        WHERE name = %s LIMIT 1
                    """, (org_name,))
                    org_result = cur.fetchone()
                    
                    if not org_result:
                        errors.append(f"Organization not found: {org_name}")
                        continue
                    
                    org_id = org_result[0]
                    
                    cur.execute("""
                        SELECT id FROM t_p24058207_website_creation_pro.users 
                        WHERE name = %s LIMIT 1
                    """, (user_name,))
                    user_result = cur.fetchone()
                    
                    if not user_result:
                        errors.append(f"User not found: {user_name}")
                        continue
                    
                    user_id = user_result[0]
                    
                    for _ in range(contact_count):
                        cur.execute("""
                            INSERT INTO t_p24058207_website_creation_pro.archive_leads_analytics
                            (user_id, organization_id, lead_type, contact_count, created_at)
                            VALUES (%s, %s, 'контакт', 1, %s)
                        """, (user_id, org_id, created_at))
                    
                    imported_count += contact_count
                    
                except Exception as e:
                    errors.append(f"Error processing row {row}: {str(e)}")
                    continue
    
    conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'imported': imported_count,
            'errors': errors[:10]
        })
    }