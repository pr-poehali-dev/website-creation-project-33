import json
import os
import psycopg2
from typing import Dict, Any
import base64
import uuid

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Загрузка и получение QR-кодов пользователей
    Args: event с httpMethod, body, headers; context с request_id
    Returns: HTTP response с результатом операции
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        if not dsn:
            raise Exception('DATABASE_URL not configured')
        
        conn = psycopg2.connect(dsn)
        cursor = conn.cursor()
        
        if method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'upload':
                user_id = body_data.get('user_id')
                qr_image_base64 = body_data.get('qr_image')
                admin_id = body_data.get('admin_id')
                
                if not user_id or not qr_image_base64:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'user_id and qr_image required'})
                    }
                
                # Сохраняем QR-код как base64 data URL
                qr_code_url = qr_image_base64
                
                # Вставляем или обновляем QR-код
                cursor.execute('''
                    INSERT INTO user_qr_codes (user_id, qr_code_url, uploaded_by)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (user_id) 
                    DO UPDATE SET qr_code_url = EXCLUDED.qr_code_url, 
                                  uploaded_at = NOW(),
                                  uploaded_by = EXCLUDED.uploaded_by
                    RETURNING id
                ''', (user_id, qr_code_url, admin_id))
                
                conn.commit()
                qr_id = cursor.fetchone()[0]
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'success': True,
                        'qr_id': qr_id,
                        'message': 'QR-код успешно загружен'
                    })
                }
            
            elif action == 'delete':
                user_id = body_data.get('user_id')
                
                if not user_id:
                    return {
                        'statusCode': 400,
                        'headers': headers,
                        'body': json.dumps({'error': 'user_id required'})
                    }
                
                cursor.execute('UPDATE user_qr_codes SET qr_code_url = NULL WHERE user_id = %s', (user_id,))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({
                        'success': True,
                        'message': 'QR-код удален'
                    })
                }
        
        elif method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            user_id = params.get('user_id')
            
            if user_id:
                # Получить QR-код конкретного пользователя
                cursor.execute('''
                    SELECT qr_code_url, uploaded_at 
                    FROM user_qr_codes 
                    WHERE user_id = %s AND qr_code_url IS NOT NULL
                ''', (user_id,))
                
                result = cursor.fetchone()
                
                if result:
                    return {
                        'statusCode': 200,
                        'headers': headers,
                        'body': json.dumps({
                            'qr_code_url': result[0],
                            'uploaded_at': result[1].isoformat() if result[1] else None
                        })
                    }
                else:
                    return {
                        'statusCode': 404,
                        'headers': headers,
                        'body': json.dumps({'error': 'QR-код не найден'})
                    }
            else:
                # Получить все QR-коды (возвращаем пустой массив, если нет данных)
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'qr_codes': []})
                }
        
        return {
            'statusCode': 405,
            'headers': headers,
            'body': json.dumps({'error': 'Method not allowed'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': str(e)})
        }
    finally:
        if 'cursor' in locals():
            cursor.close()
        if 'conn' in locals():
            conn.close()