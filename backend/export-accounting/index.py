'''
Business: Export accounting data to Google Sheets on separate sheet
Args: event with httpMethod, headers; context with request_id
Returns: HTTP response with success status
'''

import json
import os
from typing import Dict, Any
from datetime import datetime
import psycopg2
from psycopg2.extras import RealDictCursor
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

def get_db_connection():
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
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
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        credentials_json = os.environ.get('GOOGLE_SHEETS_CREDENTIALS_NEW')
        sheet_id = os.environ.get('GOOGLE_SHEET_ID_NEW')
        
        if not credentials_json or not sheet_id:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Missing Google Sheets credentials'})
            }
        
        credentials_data = json.loads(credentials_json)
        credentials = Credentials.from_service_account_info(
            credentials_data,
            scopes=['https://www.googleapis.com/auth/spreadsheets']
        )
        
        service = build('sheets', 'v4', credentials=credentials)
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("""
            SELECT 
                ws.shift_date,
                u.full_name as user_name,
                o.name as organization_name,
                ws.shift_start,
                ws.shift_end,
                COALESCE(SUM(la.contacts_count), 0) as contacts_count,
                COALESCE(AVG(la.contact_rate), 0) as contact_rate,
                COALESCE(MAX(la.payment_type), 'cash') as payment_type,
                COALESCE(ae.expense_amount, 0) as expense_amount,
                COALESCE(ae.expense_comment, '') as expense_comment,
                COALESCE(ae.paid_by_organization, false) as paid_by_organization,
                COALESCE(ae.paid_to_worker, false) as paid_to_worker,
                COALESCE(ae.paid_kvv, false) as paid_kvv,
                COALESCE(ae.paid_kms, false) as paid_kms
            FROM t_p24058207_website_creation_pro.work_shifts ws
            JOIN t_p24058207_website_creation_pro.users u ON ws.user_id = u.id
            JOIN t_p24058207_website_creation_pro.organizations o ON ws.organization_id = o.id
            LEFT JOIN t_p24058207_website_creation_pro.leads_analytics la 
                ON ws.user_id = la.user_id 
                AND DATE(la.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow') = ws.shift_date
                AND ws.organization_id = la.organization_id
                AND la.is_active = true
            LEFT JOIN t_p24058207_website_creation_pro.accounting_expenses ae 
                ON ws.user_id = ae.user_id 
                AND ws.shift_date = ae.work_date 
                AND ws.organization_id = ae.organization_id
            WHERE ws.shift_date >= '2025-10-20'
            GROUP BY ws.shift_date, u.full_name, o.name, ws.shift_start, ws.shift_end, 
                     ae.expense_amount, ae.expense_comment, ae.paid_by_organization, 
                     ae.paid_to_worker, ae.paid_kvv, ae.paid_kms
            ORDER BY ws.shift_date DESC, u.full_name
        """)
        
        shifts = cur.fetchall()
        cur.close()
        conn.close()
        
        sheet_name = 'Бухучет'
        
        try:
            service.spreadsheets().get(spreadsheetId=sheet_id, ranges=sheet_name).execute()
        except:
            request_body = {
                'requests': [{
                    'addSheet': {
                        'properties': {
                            'title': sheet_name,
                            'gridProperties': {
                                'frozenRowCount': 1
                            }
                        }
                    }
                }]
            }
            service.spreadsheets().batchUpdate(spreadsheetId=sheet_id, body=request_body).execute()
        
        headers = [
            'Дата', 'Сотрудник', 'Организация', 'Начало', 'Конец', 'Часов',
            'Контакты', 'Ставка', 'Сумма контакты', 'Тип оплаты',
            'Расходы', 'Комментарий расходов',
            'Оплачено орг.', 'Оплачено сотр.', 'КВВ', 'КМС'
        ]
        
        values = [headers]
        
        for shift in shifts:
            start_time = shift['shift_start'].strftime('%H:%M') if shift['shift_start'] else ''
            end_time = shift['shift_end'].strftime('%H:%M') if shift['shift_end'] else ''
            
            hours_worked = 0
            if shift['shift_start'] and shift['shift_end']:
                delta = shift['shift_end'] - shift['shift_start']
                hours_worked = delta.total_seconds() / 3600
            
            total_payment = shift['contacts_count'] * shift['contact_rate']
            
            row = [
                shift['shift_date'].strftime('%Y-%m-%d') if shift['shift_date'] else '',
                shift['user_name'] or '',
                shift['organization_name'] or '',
                start_time,
                end_time,
                f"{hours_worked:.2f}",
                str(shift['contacts_count']),
                str(shift['contact_rate']),
                str(total_payment),
                shift['payment_type'] or '',
                str(shift['expense_amount']),
                shift['expense_comment'] or '',
                'Да' if shift['paid_by_organization'] else 'Нет',
                'Да' if shift['paid_to_worker'] else 'Нет',
                'Да' if shift['paid_kvv'] else 'Нет',
                'Да' if shift['paid_kms'] else 'Нет'
            ]
            values.append(row)
        
        service.spreadsheets().values().clear(
            spreadsheetId=sheet_id,
            range=f'{sheet_name}!A1:Z'
        ).execute()
        
        service.spreadsheets().values().update(
            spreadsheetId=sheet_id,
            range=f'{sheet_name}!A1',
            valueInputOption='RAW',
            body={'values': values}
        ).execute()
        
        format_requests = [
            {
                'repeatCell': {
                    'range': {
                        'sheetId': 0,
                        'startRowIndex': 0,
                        'endRowIndex': 1
                    },
                    'cell': {
                        'userEnteredFormat': {
                            'backgroundColor': {'red': 0.2, 'green': 0.4, 'blue': 0.8},
                            'textFormat': {'bold': True, 'foregroundColor': {'red': 1, 'green': 1, 'blue': 1}}
                        }
                    },
                    'fields': 'userEnteredFormat(backgroundColor,textFormat)'
                }
            }
        ]
        
        try:
            service.spreadsheets().batchUpdate(
                spreadsheetId=sheet_id,
                body={'requests': format_requests}
            ).execute()
        except:
            pass
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'message': f'Экспортировано {len(shifts)} смен в Google Таблицу',
                'sheet_url': f'https://docs.google.com/spreadsheets/d/{sheet_id}/edit#gid=0'
            })
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }