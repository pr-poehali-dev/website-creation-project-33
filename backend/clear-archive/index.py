'''
Business: Clear all archive data (admin only)
Args: event with httpMethod DELETE and X-Session-Token header
Returns: HTTP response with deleted count
'''

import json
import os
from typing import Dict, Any
import psycopg2

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL not found')
    return psycopg2.connect(dsn)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'DELETE, OPTIONS',
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
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
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
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Forbidden: Admin access required'})
                }
    finally:
        pass
    
    if method != 'DELETE':
        conn.close()
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        with conn.cursor() as cur:
            cur.execute("SELECT COUNT(*) FROM t_p24058207_website_creation_pro.archive_leads_analytics")
            count_before = cur.fetchone()[0]
            
            cur.execute("DELETE FROM t_p24058207_website_creation_pro.archive_leads_analytics")
            conn.commit()
        
        conn.close()
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'deleted': count_before,
                'message': f'Deleted {count_before} archive records'
            })
        }
    
    except Exception as e:
        conn.close()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
