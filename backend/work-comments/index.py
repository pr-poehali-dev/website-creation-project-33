import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Управление комментариями о местах работы промоутеров
    Args: event - dict с httpMethod, body (user_name, work_date, organization, location_type, location_details, flyers_comment)
    Returns: HTTP response dict
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
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
            work_date = params.get('work_date')
            get_locations = params.get('get_locations')
            
            cursor = conn.cursor()
            
            if get_locations == 'true':
                cursor.execute("""
                    SELECT location_name
                    FROM work_locations
                    ORDER BY usage_count DESC, last_used_at DESC
                    LIMIT 50
                """)
                
                locations = [row[0] for row in cursor.fetchall()]
                cursor.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'locations': locations})
                }
            
            if not work_date:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'work_date parameter required'})
                }
            
            cursor.execute("""
                SELECT user_name, location_comment, flyers_comment, organization, location_type, location_details
                FROM work_location_comments
                WHERE work_date = %s
            """, (work_date,))
            
            comments = {}
            for row in cursor.fetchall():
                user_data = {}
                if row[1]:  # location_comment (legacy)
                    user_data['location'] = row[1]
                if row[2]:  # flyers_comment
                    user_data['flyers'] = row[2]
                if row[3]:  # organization
                    user_data['organization'] = row[3]
                if row[4]:  # location_type
                    user_data['location_type'] = row[4]
                if row[5]:  # location_details
                    user_data['location_details'] = row[5]
                if user_data:  # Only add if at least one field exists
                    comments[row[0]] = user_data
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'comments': comments})
            }
        
        elif method in ['POST', 'PUT']:
            body_data = json.loads(event.get('body', '{}'))
            user_name = body_data.get('user_name')
            work_date = body_data.get('work_date')
            location_comment = body_data.get('location_comment', '').strip()
            flyers_comment = body_data.get('flyers_comment', '').strip()
            organization = body_data.get('organization', '').strip()
            location_type = body_data.get('location_type', '').strip()
            location_details = body_data.get('location_details', '').strip()
            
            if not user_name or not work_date:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'user_name and work_date required'})
                }
            
            cursor = conn.cursor()
            
            if location_comment:
                cursor.execute("""
                    INSERT INTO work_locations (location_name, usage_count, last_used_at)
                    VALUES (%s, 1, CURRENT_TIMESTAMP)
                    ON CONFLICT (location_name)
                    DO UPDATE SET 
                        usage_count = work_locations.usage_count + 1,
                        last_used_at = CURRENT_TIMESTAMP
                """, (location_comment,))
            
            cursor.execute("""
                INSERT INTO work_location_comments 
                (user_name, work_date, location_comment, flyers_comment, organization, location_type, location_details, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (user_name, work_date)
                DO UPDATE SET 
                    location_comment = EXCLUDED.location_comment,
                    flyers_comment = EXCLUDED.flyers_comment,
                    organization = EXCLUDED.organization,
                    location_type = EXCLUDED.location_type,
                    location_details = EXCLUDED.location_details,
                    updated_at = CURRENT_TIMESTAMP
            """, (user_name, work_date, location_comment, flyers_comment, organization, location_type, location_details))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'message': 'Comment saved'})
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            cleanup = params.get('cleanup')
            
            cursor = conn.cursor()
            
            # Массовая очистка "мусорных" комментариев
            if cleanup == 'orphaned':
                cursor.execute("""
                    DELETE FROM work_location_comments wlc
                    WHERE NOT EXISTS (
                        SELECT 1 
                        FROM t_p24058207_website_creation_pro.work_shifts ws
                        JOIN t_p24058207_website_creation_pro.users u ON ws.user_id = u.id
                        WHERE LOWER(u.name) = LOWER(wlc.user_name) 
                        AND ws.shift_date = wlc.work_date
                    )
                """)
                
                deleted_count = cursor.rowcount
                conn.commit()
                cursor.close()
                conn.close()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'success': True, 'deleted': deleted_count})
                }
            
            # Удаление конкретного комментария
            user_name = params.get('user_name')
            work_date = params.get('work_date')
            
            if not user_name or not work_date:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'error': 'user_name and work_date required'})
                }
            
            cursor.execute("""
                DELETE FROM work_location_comments 
                WHERE LOWER(user_name) = LOWER(%s) AND work_date = %s
            """, (user_name, work_date))
            
            deleted_count = cursor.rowcount
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'success': True, 'deleted': deleted_count})
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