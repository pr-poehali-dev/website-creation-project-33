'''
Check for duplicate shift entries in the database
'''

import json
import os
import psycopg2
import traceback

def get_db_connection():
    """Get database connection"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise Exception('DATABASE_URL not found in environment')
    return psycopg2.connect(database_url)

def handler(event, context):
    """Check for duplicate shift entries for a specific user and date"""
    
    try:
        print("Starting duplicate check for Корельский Максим on 2026-01-05")
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Step 1: Find user_id for Корельский Максим
        print("Step 1: Finding user...")
        cur.execute("""
            SELECT id, name, email 
            FROM t_p24058207_website_creation_pro.users 
            WHERE name = %s
        """, ('Корельский Максим',))
        
        user_row = cur.fetchone()
        
        if not user_row:
            cur.close()
            conn.close()
            return {
                'statusCode': 404,
                'headers': {'Content-Type': 'application/json; charset=utf-8'},
                'body': json.dumps({
                    'error': 'User not found',
                    'user_name': 'Корельский Максим'
                }, ensure_ascii=False)
            }
        
        user_id = user_row[0]
        user_name = user_row[1]
        user_email = user_row[2]
        print(f"Found user: ID={user_id}, Name={user_name}")
        
        # Step 2: Check shift_videos table
        print("Step 2: Checking shift_videos table...")
        cur.execute("""
            SELECT 
                id,
                user_id,
                work_date,
                video_type,
                created_at,
                organization_id,
                video_url
            FROM t_p24058207_website_creation_pro.shift_videos 
            WHERE user_id = %s AND work_date = %s
            ORDER BY created_at
        """, (user_id, '2026-01-05'))
        
        shift_videos_rows = cur.fetchall()
        shift_videos_data = []
        for row in shift_videos_rows:
            shift_videos_data.append({
                'id': row[0],
                'user_id': row[1],
                'work_date': str(row[2]),
                'video_type': row[3],
                'created_at': str(row[4]),
                'organization_id': row[5],
                'video_url': row[6]
            })
        print(f"Found {len(shift_videos_data)} entries in shift_videos")
        
        # Step 3: Check work_shifts table
        print("Step 3: Checking work_shifts table...")
        cur.execute("""
            SELECT 
                id,
                user_id,
                shift_date,
                shift_start,
                shift_end,
                organization_id,
                created_at
            FROM t_p24058207_website_creation_pro.work_shifts 
            WHERE user_id = %s AND shift_date = %s
            ORDER BY created_at
        """, (user_id, '2026-01-05'))
        
        work_shifts_rows = cur.fetchall()
        work_shifts_data = []
        for row in work_shifts_rows:
            work_shifts_data.append({
                'id': row[0],
                'user_id': row[1],
                'shift_date': str(row[2]),
                'shift_start': str(row[3]) if row[3] else None,
                'shift_end': str(row[4]) if row[4] else None,
                'organization_id': row[5],
                'created_at': str(row[6])
            })
        print(f"Found {len(work_shifts_data)} entries in work_shifts")
        
        # Step 4: Get the combined result (as shown in the admin endpoint)
        print("Step 4: Getting combined result with UNION ALL...")
        cur.execute("""
            SELECT 
                user_id,
                work_date,
                shift_start,
                shift_end,
                organization_id,
                source
            FROM (
                -- Shifts from shift_videos
                SELECT 
                    sv.user_id,
                    sv.work_date,
                    MIN(CASE WHEN sv.video_type = 'start' THEN sv.created_at END) as shift_start,
                    MAX(CASE WHEN sv.video_type = 'end' THEN sv.created_at END) as shift_end,
                    sv.organization_id,
                    'shift_videos' as source
                FROM t_p24058207_website_creation_pro.shift_videos sv
                WHERE sv.user_id = %s AND sv.work_date = %s
                GROUP BY sv.user_id, sv.work_date, sv.organization_id
                
                UNION ALL
                
                -- Manual shifts from work_shifts
                SELECT 
                    ws.user_id,
                    ws.shift_date as work_date,
                    ws.shift_start,
                    ws.shift_end,
                    ws.organization_id,
                    'work_shifts' as source
                FROM t_p24058207_website_creation_pro.work_shifts ws
                WHERE ws.user_id = %s AND ws.shift_date = %s
                  AND ws.shift_start IS NOT NULL AND ws.shift_end IS NOT NULL
            ) combined_shifts
            ORDER BY shift_start
        """, (user_id, '2026-01-05', user_id, '2026-01-05'))
        
        combined_rows = cur.fetchall()
        combined_data = []
        for row in combined_rows:
            combined_data.append({
                'user_id': row[0],
                'work_date': str(row[1]),
                'shift_start': str(row[2]) if row[2] else None,
                'shift_end': str(row[3]) if row[3] else None,
                'organization_id': row[4],
                'source': row[5]
            })
        print(f"Combined result has {len(combined_data)} entries")
        
        cur.close()
        conn.close()
        
        result = {
            'user': {
                'id': user_id,
                'name': user_name,
                'email': user_email
            },
            'target_date': '2026-01-05',
            'shift_videos': {
                'count': len(shift_videos_data),
                'entries': shift_videos_data
            },
            'work_shifts': {
                'count': len(work_shifts_data),
                'entries': work_shifts_data
            },
            'combined_result': {
                'count': len(combined_data),
                'entries': combined_data,
                'has_duplicates': len(combined_data) > 1
            },
            'analysis': {
                'duplicate_detected': len(combined_data) > 1,
                'explanation': 'UNION ALL combines both tables without removing duplicates. If the same shift exists in both shift_videos and work_shifts, it will appear twice.',
                'recommendation': 'Use UNION instead of UNION ALL, or add DISTINCT to remove duplicates, or filter out shifts that exist in both tables.'
            }
        }
        
        print("Analysis complete!")
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json; charset=utf-8'},
            'body': json.dumps(result, ensure_ascii=False, indent=2)
        }
            
    except Exception as e:
        error_trace = traceback.format_exc()
        print(f"Error occurred: {str(e)}")
        print(f"Traceback: {error_trace}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json; charset=utf-8'},
            'body': json.dumps({
                'error': str(e),
                'traceback': error_trace
            }, ensure_ascii=False)
        }
