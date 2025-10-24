'''
Business: Compare Excel table data with database archive_leads_analytics table
Args: event with httpMethod POST and body containing table data
Returns: HTTP response with comparison results
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

def handler(event, context):
    try:
        # Get database records
        conn = get_db_connection()
        
        try:
            with conn.cursor() as cur:
                cur.execute("""
                    SELECT 
                        DATE(created_at + interval '3 hours') as msk_date, 
                        promoter_name, 
                        contact_count 
                    FROM t_p24058207_website_creation_pro.archive_leads_analytics 
                    WHERE DATE(created_at + interval '3 hours') >= '2025-03-15' 
                      AND DATE(created_at + interval '3 hours') <= '2025-10-24' 
                      AND lead_type = 'контакт' 
                      AND (is_excluded = FALSE OR is_excluded IS NULL)
                    ORDER BY msk_date, promoter_name
                """)
                
                db_records = []
                for row in cur.fetchall():
                    db_records.append({
                        'date': row[0].isoformat() if row[0] else None,
                        'promoter_name': row[1],
                        'contact_count': row[2]
                    })
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({
                        'success': True,
                        'records': db_records,
                        'total_count': len(db_records)
                    }, ensure_ascii=False)
                }
        finally:
            conn.close()
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'success': False,
                'error': str(e)
            })
        }
