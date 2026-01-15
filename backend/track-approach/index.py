import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Фиксация подхода (нажатия кнопки Отменить) для промоутера
    При каждом нажатии кнопки Отменить увеличивается счётчик approaches
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
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
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        organization_id = body_data.get('organization_id')
        user_id = event.get('headers', {}).get('X-User-Id')
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'X-User-Id header required'})
            }
        
        database_url = os.environ.get('DATABASE_URL')
        
        if not database_url:
            return {
                'statusCode': 500,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Database not configured'})
            }
        
        with psycopg2.connect(database_url) as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """INSERT INTO t_p24058207_website_creation_pro.leads 
                    (user_id, organization_id, notes, has_audio, approaches, created_at) 
                    VALUES (%s, %s, '', false, 1, NOW())""",
                    (int(user_id), organization_id)
                )
                conn.commit()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'success': True, 'message': 'Approach tracked'})
        }
        
    except Exception as e:
        print(f'Error tracking approach: {e}')
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
