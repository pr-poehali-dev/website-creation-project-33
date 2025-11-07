import os
import json
import psycopg2
from typing import Dict, Any, List
from datetime import datetime

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Получить распределение дней по диапазонам контактов для каждого месяца
    Args: event с httpMethod
    Returns: JSON с количеством дней в каждом диапазоне контактов по месяцам
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
        
        # Получаем распределение по диапазонам контактов для каждого месяца
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
            ),
            monthly_users AS (
                SELECT 
                    DATE_TRUNC('month', created_at) as month,
                    COUNT(DISTINCT user_id) as unique_users
                FROM t_p24058207_website_creation_pro.leads_analytics
                WHERE created_at >= '2024-03-01'
                    AND is_active = true
                GROUP BY DATE_TRUNC('month', created_at)
            )
            SELECT 
                TO_CHAR(dc.month, 'YYYY-MM') as month,
                SUM(contacts_per_day) as total_contacts,
                COUNT(day) as total_days,
                COUNT(*) FILTER (WHERE contacts_per_day >= 0 AND contacts_per_day <= 10) as range_0_10,
                COUNT(*) FILTER (WHERE contacts_per_day >= 11 AND contacts_per_day <= 15) as range_11_15,
                COUNT(*) FILTER (WHERE contacts_per_day >= 16 AND contacts_per_day <= 20) as range_16_20,
                COUNT(*) FILTER (WHERE contacts_per_day >= 21) as range_21_plus,
                COALESCE(mu.unique_users, 0) as total_users
            FROM daily_contacts dc
            LEFT JOIN monthly_users mu ON dc.month = mu.month
            GROUP BY dc.month, mu.unique_users
            ORDER BY dc.month
        '''
        
        cur.execute(query)
        rows = cur.fetchall()
        
        # Получаем детальную информацию по дням с 21+ контактами
        days_21_plus_query = '''
            SELECT 
                TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') as month,
                TO_CHAR(DATE(created_at), 'DD.MM.YYYY') as day,
                COUNT(*) as contacts,
                COUNT(DISTINCT user_id) as promoters
            FROM t_p24058207_website_creation_pro.leads_analytics
            WHERE created_at >= '2024-03-01'
                AND is_active = true
            GROUP BY DATE_TRUNC('month', created_at), DATE(created_at)
            HAVING COUNT(*) > 21
            ORDER BY DATE(created_at)
        '''
        
        cur.execute(days_21_plus_query)
        days_21_plus_rows = cur.fetchall()
        
        # Группируем дни по месяцам
        days_by_month: Dict[str, List[Dict[str, Any]]] = {}
        for row in days_21_plus_rows:
            month, day, contacts, promoters = row
            if month not in days_by_month:
                days_by_month[month] = []
            days_by_month[month].append({
                'day': day,
                'contacts': int(contacts),
                'promoters': int(promoters)
            })
        
        # Названия месяцев на русском
        month_names = {
            '01': 'Январь', '02': 'Февраль', '03': 'Март', '04': 'Апрель',
            '05': 'Май', '06': 'Июнь', '07': 'Июль', '08': 'Август',
            '09': 'Сентябрь', '10': 'Октябрь', '11': 'Ноябрь', '12': 'Декабрь'
        }
        
        monthly_stats: List[Dict[str, Any]] = []
        for row in rows:
            month, total_contacts, total_days, range_0_10, range_11_15, range_16_20, range_21_plus, total_users = row
            month_num = month.split('-')[1]
            year = month.split('-')[0]
            
            stat = {
                'month': month,
                'month_name': f'{month_names[month_num]} {year}',
                'total_contacts': int(total_contacts) if total_contacts else 0,
                'total_days': int(total_days) if total_days else 0,
                'total_users': int(total_users) if total_users else 0,
                'ranges': {
                    '0-10': int(range_0_10) if range_0_10 else 0,
                    '11-15': int(range_11_15) if range_11_15 else 0,
                    '16-20': int(range_16_20) if range_16_20 else 0,
                    '21+': int(range_21_plus) if range_21_plus else 0
                }
            }
            
            # Добавляем детальную информацию о днях с 21+ контактами
            if month in days_by_month:
                stat['days_21_plus'] = days_by_month[month]
            
            monthly_stats.append(stat)
        
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