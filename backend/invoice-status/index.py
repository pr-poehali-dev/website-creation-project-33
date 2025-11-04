'''
Business: Управление статусом выставления счетов для рабочих смен
Args: event - dict с httpMethod, queryStringParameters, body
      context - object с атрибутами request_id, function_name
Returns: HTTP response с данными о статусе счёта
'''
import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'DATABASE_URL not configured'}),
            'isBase64Encoded': False
        }
    
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {})
            user_name = params.get('user_name')
            work_date = params.get('work_date')
            
            if not user_name or not work_date:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_name and work_date required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"SELECT location_comment, invoice_issued FROM t_p24058207_website_creation_pro.work_location_comments WHERE user_name = '{user_name}' AND work_date = '{work_date}'"
            )
            row = cur.fetchone()
            
            if row:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({
                        'location_comment': row[0],
                        'invoice_issued': row[1] if row[1] is not None else False
                    }),
                    'isBase64Encoded': False
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Not found'}),
                    'isBase64Encoded': False
                }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            user_name = body_data.get('user_name')
            work_date = body_data.get('work_date')
            invoice_issued = body_data.get('invoice_issued', False)
            
            if not user_name or not work_date:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_name and work_date required'}),
                    'isBase64Encoded': False
                }
            
            cur.execute(
                f"UPDATE t_p24058207_website_creation_pro.work_location_comments SET invoice_issued = {invoice_issued}, updated_at = CURRENT_TIMESTAMP WHERE user_name = '{user_name}' AND work_date = '{work_date}'"
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'invoice_issued': invoice_issued}),
                'isBase64Encoded': False
            }
        
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    finally:
        cur.close()
        conn.close()
