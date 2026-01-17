'''
Business: Get user contact statistics (today and total)
Args: event - dict with httpMethod, queryStringParameters (user_id)
      context - object with attributes: request_id, function_name
Returns: HTTP response with contact statistics
'''

import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    # Handle CORS OPTIONS request
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    # Get user_id from query parameters
    params = event.get('queryStringParameters') or {}
    user_id = params.get('user_id')
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'user_id is required'}),
            'isBase64Encoded': False
        }
    
    # Connect to database
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Database configuration error'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    # Get statistics using simple query (no parameters)
    # Moscow time is UTC+3, so we need to check if created_at + 3 hours is today
    if user_id == 'all':
        query = """
            SELECT 
                COUNT(*) FILTER (WHERE lead_type = 'контакт') as total_contacts,
                SUM(CASE WHEN DATE(created_at + INTERVAL '3 hours') = DATE(NOW() + INTERVAL '3 hours') AND lead_type = 'контакт' THEN 1 ELSE 0 END) as today_contacts,
                SUM(CASE WHEN DATE(created_at + INTERVAL '3 hours') = DATE(NOW() + INTERVAL '3 hours') AND lead_type = 'подход' THEN 1 ELSE 0 END) as today_approaches
            FROM t_p24058207_website_creation_pro.leads_analytics
            WHERE user_id != 999
        """
    else:
        query = f"""
            SELECT 
                COUNT(*) FILTER (WHERE lead_type = 'контакт') as total_contacts,
                SUM(CASE WHEN DATE(created_at + INTERVAL '3 hours') = DATE(NOW() + INTERVAL '3 hours') AND lead_type = 'контакт' THEN 1 ELSE 0 END) as today_contacts,
                SUM(CASE WHEN DATE(created_at + INTERVAL '3 hours') = DATE(NOW() + INTERVAL '3 hours') AND lead_type = 'подход' THEN 1 ELSE 0 END) as today_approaches
            FROM t_p24058207_website_creation_pro.leads_analytics
            WHERE user_id = {int(user_id)} AND user_id != 999
        """
    
    cur.execute(query)
    result = cur.fetchone()
    
    cur.close()
    conn.close()
    
    # Format response
    total_contacts = result[0] if result else 0
    today_contacts = result[1] if result and result[1] else 0
    today_approaches = result[2] if result and result[2] else 0
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'total_contacts': total_contacts,
            'today_contacts': today_contacts,
            'today_approaches': today_approaches
        }),
        'isBase64Encoded': False
    }