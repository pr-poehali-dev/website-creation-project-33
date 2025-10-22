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

def parse_moscow_datetime(datetime_str: str) -> str:
    '''Parse Moscow datetime and convert to UTC'''
    formats = [
        "%d.%m.%Y %H:%M:%S",
        "%d.%m.%Y %H:%M",
        "%d.%m.%Y",
        "%Y-%m-%d %H:%M:%S",
        "%Y-%m-%d %H:%M",
        "%Y-%m-%d",
    ]
    
    dt = None
    for fmt in formats:
        try:
            dt = datetime.strptime(datetime_str.strip(), fmt)
            break
        except ValueError:
            continue
    
    if not dt:
        raise ValueError(f"Cannot parse datetime: {datetime_str}")
    
    return dt.strftime("%Y-%m-%d %H:%M:%S+03:00")

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
    
    actual_columns = set(csv_data[0].keys()) if csv_data else set()
    
    required_columns_ru = {'Дата', 'Организация', 'Промоутер', 'Контакты'}
    required_columns_en = {'datetime', 'organization', 'user', 'count'}
    
    has_russian = required_columns_ru.issubset(actual_columns)
    has_english = required_columns_en.issubset(actual_columns)
    
    if not has_russian and not has_english:
        conn.close()
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'error': 'CSV format error. Expected columns: datetime, organization, user, count',
                'expected_en': list(required_columns_en),
                'expected_ru': list(required_columns_ru),
                'found': list(actual_columns)
            })
        }
    
    use_russian = has_russian
    
    imported_count = 0
    errors = []
    
    try:
        with conn.cursor() as cur:
            org_cache = {}
            
            cur.execute("SELECT id, name FROM t_p24058207_website_creation_pro.organizations")
            for org_id, org_name in cur.fetchall():
                org_cache[org_name] = org_id
            
            records_to_insert = []
            
            for row in csv_data:
                if use_russian:
                    date_time = row.get('Дата', '').strip()
                    org_name = row.get('Организация', '').strip()
                    promoter_name = row.get('Промоутер', '').strip()
                    contact_count_str = row.get('Контакты', '0').strip()
                else:
                    date_time = row.get('datetime', '').strip()
                    org_name = row.get('organization', '').strip()
                    promoter_name = row.get('user', '').strip()
                    contact_count_str = str(row.get('count', 0)).strip()
                
                try:
                    contact_count = int(contact_count_str) if contact_count_str and contact_count_str.isdigit() else 1
                except (ValueError, TypeError):
                    contact_count = 1
                
                if not date_time or not promoter_name:
                    errors.append(f"Skipped row: missing date or promoter name")
                    continue
                
                try:
                    created_at = parse_moscow_datetime(date_time)
                    
                    org_id = None
                    if org_name:
                        if org_name not in org_cache:
                            cur.execute("""
                                INSERT INTO t_p24058207_website_creation_pro.organizations (name)
                                VALUES (%s) RETURNING id
                            """, (org_name,))
                            org_cache[org_name] = cur.fetchone()[0]
                        org_id = org_cache[org_name]
                    
                    records_to_insert.append((
                        org_id,
                        promoter_name,
                        max(1, contact_count),
                        created_at
                    ))
                    
                except Exception as e:
                    errors.append(f"Error processing row (date={date_time}, org={org_name}, promoter={promoter_name}): {str(e)}")
                    continue
            
            if records_to_insert:
                print(f"Inserting {len(records_to_insert)} records")
                print(f"First record sample: {records_to_insert[0] if records_to_insert else 'None'}")
                
                for record in records_to_insert:
                    org_id, promoter_name, contact_count, created_at = record
                    
                    if contact_count < 1:
                        errors.append(f"Invalid contact_count: {contact_count}")
                        continue
                    if created_at is None:
                        errors.append(f"NULL created_at in record")
                        continue
                    
                    try:
                        cur.execute("""
                            INSERT INTO t_p24058207_website_creation_pro.archive_leads_analytics
                            (user_id, organization_id, promoter_name, lead_type, contact_count, created_at)
                            VALUES (%s, %s, %s, %s, %s, %s)
                        """, (None, org_id, promoter_name, 'контакт', contact_count, created_at))
                        imported_count += 1
                    except Exception as e:
                        errors.append(f"Insert failed: {str(e)}")
                        continue
        
        conn.commit()
    finally:
        conn.close()
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({
            'imported': imported_count,
            'errors': errors[:10]
        })
    }