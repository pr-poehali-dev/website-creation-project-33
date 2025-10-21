'''
Обновление организаций для контактов
Args: event с httpMethod, body, headers; context с request_id
Returns: JSON с результатом обновления
'''

import json
import os
import psycopg2
from typing import Dict, Any, List

def get_db_connection():
    """Получить подключение к базе данных"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise Exception('DATABASE_URL not found in environment')
    return psycopg2.connect(database_url)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Обновить организации для контактов
    Args: event - dict с httpMethod, body
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'POST')
    
    # Handle CORS OPTIONS request
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
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    updates = body_data.get('updates', [])
    
    if not updates:
        return {
            'statusCode': 400,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'No updates provided'})
        }
    
    updated_count = 0
    
    conn = get_db_connection()
    try:
        cur = conn.cursor()
        try:
            for update in updates:
                lead_ids = update.get('lead_ids', [])
                organization_id = update.get('organization_id')
                
                if not lead_ids or organization_id is None:
                    continue
                
                # Обновляем организацию для указанных лидов
                cur.execute("""
                    UPDATE t_p24058207_website_creation_pro.leads_analytics
                    SET organization_id = %s
                    WHERE id = ANY(%s)
                """, (organization_id, lead_ids))
                
                updated_count += cur.rowcount
            
            conn.commit()
        finally:
            cur.close()
    finally:
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
            'updated_count': updated_count
        })
    }