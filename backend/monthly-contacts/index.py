import os
import json
import psycopg2
from typing import Dict, Any, List
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получить медианные значения контактов по месяцам начиная с марта
    Args: event с httpMethod
    Returns: JSON с медианными контактами по месяцам
    '''
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method != 'GET':
        return {
            'statusCode': 405,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    conn = None
    
    try:
        dsn = os.environ.get('DATABASE_URL')
        if not dsn:
            raise ValueError('DATABASE_URL not set')
        
        conn = psycopg2.connect(dsn)
        cur = conn.cursor()
        
        # Получаем медианную статистику по месяцам начиная с марта 2024
        query = '''
            WITH daily_contacts AS (
                SELECT 
                    DATE_TRUNC('month', created_at) as month,
                    DATE(created_at) as day,
                    COUNT(*) FILTER (WHERE lead_type = 'контакт') as contacts_per_day
                FROM t_p24058207_website_creation_pro.leads_analytics
                WHERE created_at >= '2024-03-01'
                    AND is_active = true
                GROUP BY DATE_TRUNC('month', created_at), DATE(created_at)
            )
            SELECT 
                TO_CHAR(month, 'YYYY-MM') as month,
                SUM(contacts_per_day) as total_contacts,
                COUNT(day) as days_count,
                PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY contacts_per_day) as median_contacts
            FROM daily_contacts
            GROUP BY month
            ORDER BY month
        '''
        
        cur.execute(query)
        rows = cur.fetchall()
        
        # Названия месяцев на русском
        month_names = {
            '01': 'Январь', '02': 'Февраль', '03': 'Март', '04': 'Апрель',
            '05': 'Май', '06': 'Июнь', '07': 'Июль', '08': 'Август',
            '09': 'Сентябрь', '10': 'Октябрь', '11': 'Ноябрь', '12': 'Декабрь'
        }
        
        monthly_stats: List[Dict[str, Any]] = []
        for row in rows:
            month, total_contacts, days_count, median_contacts = row
            month_num = month.split('-')[1]
            year = month.split('-')[0]
            
            monthly_stats.append({
                'month': month,
                'month_name': f'{month_names[month_num]} {year}',
                'median_contacts': round(float(median_contacts), 1) if median_contacts else 0,
                'days_count': days_count,
                'total_contacts': int(total_contacts) if total_contacts else 0
            })
        
        cur.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'monthly_stats': monthly_stats
            }, ensure_ascii=False)
        }
        
    except Exception as e:
        print(f'Error: {str(e)}')
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
    
    finally:
        if conn:
            conn.close()