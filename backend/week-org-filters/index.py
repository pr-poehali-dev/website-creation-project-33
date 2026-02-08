import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление фильтрами организаций для недель
    Args: event - dict с httpMethod, body (week_start, organizations)
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'DATABASE_URL not configured'})
        }
    
    conn = psycopg2.connect(database_url)
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            action = params.get('action')
            
            if action == 'get_all_organizations':
                cursor = conn.cursor()
                cursor.execute("""
                    SELECT DISTINCT name 
                    FROM t_p24058207_website_creation_pro.organizations 
                    WHERE name IS NOT NULL AND name != ''
                      AND name NOT IN ('Администратор', 'Корректировка', 'Корректировка (безнал)', 
                                       'Корректировка (нал)', 'Удалить')
                      AND is_active = true
                    ORDER BY name
                """)
                
                organizations = [row[0] for row in cursor.fetchall()]
                cursor.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'organizations': organizations})
                }
            
            week_start = params.get('week_start')
            
            if not week_start:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'week_start parameter required'})
                }
            
            cursor = conn.cursor()
            cursor.execute("""
                SELECT organizations
                FROM week_organization_filters
                WHERE week_start = %s
            """, (week_start,))
            
            row = cursor.fetchone()
            cursor.close()
            conn.close()
            
            if row:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'organizations': row[0]})
                }
            else:
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'organizations': []})
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            week_start = body_data.get('week_start')
            organizations = body_data.get('organizations', [])
            
            if not week_start:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'week_start required'})
                }
            
            cursor = conn.cursor()
            
            cursor.execute("""
                INSERT INTO week_organization_filters (week_start, organizations, updated_at)
                VALUES (%s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (week_start)
                DO UPDATE SET 
                    organizations = EXCLUDED.organizations,
                    updated_at = CURRENT_TIMESTAMP
            """, (week_start, json.dumps(organizations)))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'message': 'Filters saved'})
            }
        
        else:
            conn.close()
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except Exception as e:
        if conn:
            conn.close()
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }