import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Синхронизирует данные из leads_analytics в archive_leads_analytics
    Args: event - dict с httpMethod и headers (X-Session-Token)
          context - объект с атрибутами request_id, function_name
    Returns: HTTP response dict с результатом синхронизации
    '''
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
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Метод не поддерживается'})
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
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Требуется авторизация'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'DATABASE_URL не настроен'})
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    schema = 't_p24058207_website_creation_pro'
    
    escaped_token = session_token.replace("'", "''")
    cur.execute(f"""
        SELECT u.is_admin 
        FROM {schema}.users u
        JOIN {schema}.user_sessions s ON u.id = s.user_id
        WHERE s.session_token = '{escaped_token}' AND s.expires_at > NOW()
    """)
    
    result = cur.fetchone()
    if not result or not result[0]:
        cur.close()
        conn.close()
        return {
            'statusCode': 403,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Доступ запрещен'})
        }
    
    cur.execute(f"""
        INSERT INTO {schema}.archive_leads_analytics 
          (user_id, organization_id, lead_type, contact_count, created_at, promoter_name, notes, is_excluded)
        SELECT 
          l.user_id,
          l.organization_id,
          l.lead_type,
          COUNT(*) as contact_count,
          DATE(l.created_at) as created_at,
          u.name as promoter_name,
          STRING_AGG(DISTINCT l.notes, '; ') FILTER (WHERE l.notes IS NOT NULL AND l.notes != '') as notes,
          false as is_excluded
        FROM {schema}.leads_analytics l
        JOIN {schema}.users u ON l.user_id = u.id
        WHERE 
          l.is_active = true 
          AND l.lead_type = 'контакт'
          AND NOT EXISTS (
            SELECT 1 
            FROM {schema}.archive_leads_analytics a
            WHERE a.user_id = l.user_id
              AND a.organization_id = l.organization_id
              AND a.lead_type = l.lead_type
              AND DATE(a.created_at) = DATE(l.created_at)
          )
        GROUP BY l.user_id, l.organization_id, l.lead_type, DATE(l.created_at), u.name
        ORDER BY DATE(l.created_at) DESC
    """)
    
    rows_inserted = cur.rowcount
    conn.commit()
    
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
            'success': True,
            'rows_inserted': rows_inserted,
            'message': f'Синхронизировано {rows_inserted} записей'
        })
    }