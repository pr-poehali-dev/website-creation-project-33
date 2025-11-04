"""
Business: Compare current month contacts with previous month for same day of month
Args: event - HTTP request with X-Session-Token header
Returns: JSON with current month and previous month contact counts up to current day
"""

import json
import os
import psycopg2
from datetime import datetime, timedelta
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
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
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    headers = event.get('headers', {})
    session_token = headers.get('X-Session-Token') or headers.get('x-session-token')
    
    if not session_token:
        return {
            'statusCode': 401,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Database configuration missing'})
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    now_moscow = datetime.utcnow() + timedelta(hours=3)
    current_day = now_moscow.day
    
    current_query = f"""
        SELECT COUNT(*) 
        FROM t_p24058207_website_creation_pro.leads_analytics
        WHERE lead_type = 'контакт'
        AND DATE(created_at + INTERVAL '3 hours') >= DATE_TRUNC('month', NOW() + INTERVAL '3 hours')
        AND DATE(created_at + INTERVAL '3 hours') <= DATE(NOW() + INTERVAL '3 hours')
    """
    cur.execute(current_query)
    current_month_contacts = cur.fetchone()[0]
    
    prev_query = f"""
        SELECT COUNT(*) 
        FROM t_p24058207_website_creation_pro.leads_analytics
        WHERE lead_type = 'контакт'
        AND DATE(created_at + INTERVAL '3 hours') >= DATE_TRUNC('month', NOW() + INTERVAL '3 hours' - INTERVAL '1 month')
        AND DATE(created_at + INTERVAL '3 hours') <= (DATE_TRUNC('month', NOW() + INTERVAL '3 hours') - INTERVAL '1 month' + INTERVAL '{current_day - 1} days')
    """
    cur.execute(prev_query)
    prev_month_contacts = cur.fetchone()[0]
    
    cur.close()
    conn.close()
    
    difference = current_month_contacts - prev_month_contacts
    percentage_change = 0
    if prev_month_contacts > 0:
        percentage_change = round((difference / prev_month_contacts) * 100, 1)
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'current_month_contacts': current_month_contacts,
            'prev_month_contacts': prev_month_contacts,
            'difference': difference,
            'percentage_change': percentage_change,
            'current_day': current_day
        })
    }