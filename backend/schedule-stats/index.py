'''
Business: Get promoter statistics and daily contact forecasts
Args: event with httpMethod, body; context with request_id
Returns: HTTP response with promoter stats and daily actual contacts
'''

import json
import os
import psycopg2
from typing import Dict, Any, List
from datetime import datetime

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
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    # GET - get average contacts per day for all promoters
    if method == 'GET':
        conn = get_db_connection()
        cur = conn.cursor()
        
        cur.execute("""
            SELECT 
                u.id as user_id,
                u.name,
                COUNT(la.id) as total_contacts,
                COUNT(DISTINCT DATE(la.created_at)) as days_worked,
                CASE 
                    WHEN COUNT(DISTINCT DATE(la.created_at)) > 0 
                    THEN ROUND(COUNT(la.id)::numeric / COUNT(DISTINCT DATE(la.created_at)), 2)
                    ELSE 0
                END as avg_contacts_per_day
            FROM t_p24058207_website_creation_pro.users u
            LEFT JOIN t_p24058207_website_creation_pro.leads_analytics la ON u.id = la.user_id
            WHERE u.is_admin = false
            GROUP BY u.id, u.name
        """)
        
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        stats = []
        for row in rows:
            stats.append({
                'user_id': row[0],
                'name': row[1],
                'total_contacts': row[2],
                'days_worked': row[3],
                'avg_contacts_per_day': float(row[4]) if row[4] else 0
            })
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'stats': stats})
        }
    
    # POST - get actual contacts for specific dates
    if method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        dates = body_data.get('dates', [])
        
        if not dates:
            return {
                'statusCode': 400,
                'headers': headers,
                'body': json.dumps({'error': 'dates required'})
            }
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Build query with date list
        date_list = ','.join([f"'{d}'" for d in dates])
        
        cur.execute(f"""
            SELECT 
                DATE(created_at) as date,
                COUNT(id) as count
            FROM t_p24058207_website_creation_pro.leads_analytics
            WHERE DATE(created_at) IN ({date_list})
            GROUP BY DATE(created_at)
        """)
        
        rows = cur.fetchall()
        cur.close()
        conn.close()
        
        actual = []
        for row in rows:
            actual.append({
                'date': row[0].isoformat(),
                'count': row[1]
            })
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'actual': actual})
        }
    
    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'Method not allowed'})
    }
