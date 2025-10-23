'''
Business: Get archive statistics (charts, ratings, organizations)
Args: event with httpMethod GET and queryStringParameters (action: chart|promoters|organizations)
Returns: HTTP response with statistics data
'''

import json
import os
from typing import Dict, Any, List
from datetime import datetime, timedelta
import psycopg2

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        raise Exception('DATABASE_URL not found')
    return psycopg2.connect(dsn)

def get_moscow_time_from_utc(utc_dt):
    '''Convert UTC datetime to Moscow time'''
    if utc_dt.tzinfo is None:
        return utc_dt + timedelta(hours=3)
    return utc_dt.astimezone(tz=None) + timedelta(hours=3)

def get_chart_data() -> List[Dict[str, Any]]:
    '''Get daily contacts chart data with user breakdown'''
    conn = get_db_connection()
    
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    l.created_at, 
                    COALESCE(l.promoter_name, u.name) as promoter_name, 
                    l.contact_count
                FROM t_p24058207_website_creation_pro.archive_leads_analytics l
                LEFT JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
                WHERE l.lead_type = 'контакт' AND (l.is_excluded = FALSE OR l.is_excluded IS NULL)
                ORDER BY l.created_at
            """)
            
            daily_data = {}
            
            for row in cur.fetchall():
                if row[0]:
                    moscow_dt = get_moscow_time_from_utc(row[0])
                    date_key = moscow_dt.date().isoformat()
                    user_name = row[1] or 'Неизвестно'
                    count = row[2]
                    
                    if date_key not in daily_data:
                        daily_data[date_key] = {'date': date_key, 'total': 0, 'users': {}}
                    
                    daily_data[date_key]['total'] += count
                    
                    if user_name not in daily_data[date_key]['users']:
                        daily_data[date_key]['users'][user_name] = 0
                    daily_data[date_key]['users'][user_name] += count
            
            result = []
            for date_key in sorted(daily_data.keys()):
                data = daily_data[date_key]
                users_list = [{'name': name, 'count': count} for name, count in data['users'].items()]
                users_list.sort(key=lambda x: x['count'], reverse=True)
                
                result.append({
                    'date': data['date'],
                    'total': data['total'],
                    'users': users_list
                })
            
            return result
    finally:
        conn.close()

def get_promoters_rating() -> List[Dict[str, Any]]:
    '''Get promoters rating by total contacts with daily breakdown'''
    conn = get_db_connection()
    
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    COALESCE(l.promoter_name, u.name) as promoter_name, 
                    SUM(l.contact_count) as total_contacts
                FROM t_p24058207_website_creation_pro.archive_leads_analytics l
                LEFT JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
                WHERE l.lead_type = 'контакт' AND (l.is_excluded = FALSE OR l.is_excluded IS NULL)
                GROUP BY COALESCE(l.promoter_name, u.name)
                ORDER BY total_contacts DESC
            """)
            
            result = []
            rank = 1
            for row in cur.fetchall():
                promoter_name = row[0] or 'Неизвестно'
                total_contacts = int(row[1])
                
                escaped_name = promoter_name.replace("'", "''")
                cur.execute(f"""
                    SELECT 
                        DATE(l.created_at) as date,
                        SUM(l.contact_count) as daily_contacts
                    FROM t_p24058207_website_creation_pro.archive_leads_analytics l
                    WHERE COALESCE(l.promoter_name, '') = '{escaped_name}'
                      AND l.lead_type = 'контакт' 
                      AND (l.is_excluded = FALSE OR l.is_excluded IS NULL)
                    GROUP BY DATE(l.created_at)
                    ORDER BY DATE(l.created_at) DESC
                """)
                
                daily_breakdown = []
                for daily_row in cur.fetchall():
                    daily_breakdown.append({
                        'date': daily_row[0].isoformat() if daily_row[0] else '',
                        'contacts': int(daily_row[1])
                    })
                
                result.append({
                    'rank': rank,
                    'name': promoter_name,
                    'contacts': total_contacts,
                    'dailyBreakdown': daily_breakdown
                })
                rank += 1
            
            return result
    finally:
        conn.close()

def get_promoters_by_days() -> List[Dict[str, Any]]:
    '''Get promoters rating by days worked'''
    conn = get_db_connection()
    
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    COALESCE(l.promoter_name, u.name) as promoter_name, 
                    MIN(DATE(l.created_at)) as first_date,
                    MAX(DATE(l.created_at)) as last_date,
                    SUM(l.contact_count) as total_contacts
                FROM t_p24058207_website_creation_pro.archive_leads_analytics l
                LEFT JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
                WHERE l.lead_type = 'контакт' AND (l.is_excluded = FALSE OR l.is_excluded IS NULL)
                GROUP BY COALESCE(l.promoter_name, u.name)
            """)
            
            result = []
            for row in cur.fetchall():
                promoter_name = row[0] or 'Неизвестно'
                first_date = row[1]
                last_date = row[2]
                total_contacts = int(row[3])
                
                days_worked = 0
                if first_date and last_date:
                    days_worked = (last_date - first_date).days + 1
                
                result.append({
                    'name': promoter_name,
                    'daysWorked': days_worked,
                    'contacts': total_contacts,
                    'firstDate': first_date.isoformat() if first_date else '',
                    'lastDate': last_date.isoformat() if last_date else ''
                })
            
            result.sort(key=lambda x: x['daysWorked'], reverse=True)
            
            for i, promoter in enumerate(result, 1):
                promoter['rank'] = i
            
            return result
    finally:
        conn.close()

def get_organizations_stats() -> List[Dict[str, Any]]:
    '''Get organizations statistics'''
    conn = get_db_connection()
    
    try:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    o.name as organization_name,
                    COUNT(DISTINCT l.promoter_name) as promoters_count,
                    SUM(l.contact_count) as total_contacts
                FROM t_p24058207_website_creation_pro.archive_leads_analytics l
                JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
                WHERE l.lead_type = 'контакт' AND (l.is_excluded = FALSE OR l.is_excluded IS NULL)
                GROUP BY o.name
                ORDER BY total_contacts DESC
            """)
            
            result = []
            for row in cur.fetchall():
                result.append({
                    'organization': row[0],
                    'promoters': int(row[1]),
                    'contacts': int(row[2])
                })
            
            return result
    finally:
        conn.close()

def get_organization_promoters(organization_name: str) -> List[Dict[str, Any]]:
    '''Get promoters details for specific organization'''
    conn = get_db_connection()
    
    try:
        escaped_name = organization_name.replace("'", "''")
        
        with conn.cursor() as cur:
            cur.execute(f"""
                SELECT 
                    l.promoter_name,
                    SUM(l.contact_count) as total_contacts
                FROM t_p24058207_website_creation_pro.archive_leads_analytics l
                JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
                WHERE o.name = '{escaped_name}' AND l.lead_type = 'контакт' AND (l.is_excluded = FALSE OR l.is_excluded IS NULL)
                GROUP BY l.promoter_name
                ORDER BY total_contacts DESC
            """)
            
            result = []
            for row in cur.fetchall():
                result.append({
                    'name': row[0],
                    'contacts': int(row[1])
                })
            
            return result
    finally:
        conn.close()

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
        escaped_token = session_token.replace("'", "''")
        with conn.cursor() as cur:
            cur.execute(f"""
                SELECT u.is_admin 
                FROM t_p24058207_website_creation_pro.users u
                JOIN t_p24058207_website_creation_pro.user_sessions s ON s.user_id = u.id
                WHERE s.session_token = '{escaped_token}' AND s.expires_at > NOW()
            """)
            result = cur.fetchone()
            
            if not result or not result[0]:
                return {
                    'statusCode': 403,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'Forbidden: Admin access required'})
                }
    finally:
        conn.close()
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    params = event.get('queryStringParameters', {}) or {}
    action = params.get('action', 'chart')
    
    try:
        if action == 'chart':
            data = get_chart_data()
        elif action == 'promoters':
            data = get_promoters_rating()
        elif action == 'promoters_by_days':
            data = get_promoters_by_days()
        elif action == 'organizations':
            data = get_organizations_stats()
        elif action == 'organization_promoters':
            org_name = params.get('organization')
            if not org_name:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Organization name required'})
                }
            data = get_organization_promoters(org_name)
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid action'})
            }
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'data': data})
        }
    
    except Exception as e:
        print(f"Error in handler: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({'error': str(e)})
        }