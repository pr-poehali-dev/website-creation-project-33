import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Управление комментариями о местах работы промоутеров.
    Ключ уникальности: (user_name, work_date, shift_time) — чтобы один промоутер
    мог иметь разные места работы в разных сменах одного дня.
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
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
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
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'locations': locations})
                }
            
            if not work_date:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'work_date parameter required'})
                }
            
            # Возвращаем данные с учётом shift_time
            cursor.execute("""
                SELECT user_name, location_comment, flyers_comment, organization, location_type, location_details, shift_time
                FROM work_location_comments
                WHERE work_date = %s
            """, (work_date,))
            
            # Структура: { user_name: { shift_time: {...data} } }
            # Для обратной совместимости shift_time=NULL хранится под ключом ''
            comments = {}
            for row in cursor.fetchall():
                user_name_val, location_comment, flyers_comment, organization, location_type, location_details, shift_time_val = row
                user_data = {}
                if location_comment:
                    user_data['location'] = location_comment
                if flyers_comment:
                    user_data['flyers'] = flyers_comment
                if organization:
                    user_data['organization'] = organization
                if location_type:
                    user_data['location_type'] = location_type
                if location_details:
                    user_data['location_details'] = location_details
                
                if user_data:
                    shift_key = shift_time_val or ''
                    if user_name_val not in comments:
                        comments[user_name_val] = {}
                    if shift_key:
                        comments[user_name_val][shift_key] = user_data
                    else:
                        # legacy: без смены — кладём в корень для обратной совместимости
                        comments[user_name_val].update(user_data)
            
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'comments': comments})
            }
        
        elif method in ['POST', 'PUT']:
            body_data = json.loads(event.get('body', '{}'))
            user_name = body_data.get('user_name')
            work_date = body_data.get('work_date')
            shift_time = body_data.get('shift_time', '').strip() or None  # напр. "12:00-16:00"
            location_comment = body_data.get('location_comment', '').strip()
            flyers_comment = body_data.get('flyers_comment', '').strip()
            organization = body_data.get('organization', '').strip()
            location_type = body_data.get('location_type', '').strip()
            location_details = body_data.get('location_details', '').strip()
            
            if not user_name or not work_date:
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
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
                (user_name, work_date, shift_time, location_comment, flyers_comment, organization, location_type, location_details, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (user_name, work_date, shift_time)
                DO UPDATE SET 
                    location_comment = EXCLUDED.location_comment,
                    flyers_comment = EXCLUDED.flyers_comment,
                    organization = EXCLUDED.organization,
                    location_type = EXCLUDED.location_type,
                    location_details = EXCLUDED.location_details,
                    updated_at = CURRENT_TIMESTAMP
            """, (user_name, work_date, shift_time, location_comment, flyers_comment, organization, location_type, location_details))
            
            conn.commit()
            cursor.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'message': 'Comment saved'})
            }
        
        elif method == 'DELETE':
            params = event.get('queryStringParameters', {})
            cleanup = params.get('cleanup')
            
            cursor = conn.cursor()
            
            if cleanup == 'orphaned':
                cursor.execute("""
                    DELETE FROM work_location_comments wlc
                    WHERE NOT EXISTS (
                        SELECT 1 
                        FROM work_shifts ws
                        JOIN users u ON ws.user_id = u.id
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
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'deleted': deleted_count})
                }
            
            user_name = params.get('user_name')
            work_date = params.get('work_date')
            shift_time = params.get('shift_time')
            
            if not user_name or not work_date:
                cursor.close()
                conn.close()
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'user_name and work_date required'})
                }
            
            if shift_time:
                cursor.execute("""
                    DELETE FROM work_location_comments 
                    WHERE LOWER(user_name) = LOWER(%s) AND work_date = %s AND shift_time = %s
                """, (user_name, work_date, shift_time))
            else:
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
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True, 'deleted': deleted_count})
            }
        
        else:
            conn.close()
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'})
            }
    
    except Exception as e:
        if conn:
            conn.close()
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
