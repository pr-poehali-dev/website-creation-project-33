'''
Business: Export accounting data to Google Sheets on separate sheet
Args: event with httpMethod, headers, body (shifts data); context with request_id
Returns: HTTP response with success status and sheet URL
'''

import json
import os
from typing import Dict, Any
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build

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
        body_data = json.loads(event.get('body', '{}'))
        shifts = body_data.get('shifts', [])
        
        if not shifts:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'No shifts data provided'})
            }
        
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
            'Дата', 'Время', 'Организация', 'Сумма прихода', 'Оплата', 'Налог 6%', 
            'После налога', 'Промоутер', 'Контакты', 'Зарплата', 'Расход', 
            'Комментарий', 'Чистый остаток', 'КВВ', 'КМС',
            'Опл. орг.', 'Опл. испол.', 'Опл. КВВ', 'Опл. КМС'
        ]
        
        values = [headers]
        
        for shift in shifts:
            start_time = shift.get('start_time', '')
            end_time = shift.get('end_time', '')
            time_str = f"{start_time[:5]} - {end_time[:5]}" if start_time and end_time else ''
            
            contacts = shift.get('contacts_count', 0)
            rate = shift.get('contact_rate', 0)
            revenue = contacts * rate
            
            payment_type = shift.get('payment_type', '')
            tax = round(revenue * 0.06) if payment_type == 'cashless' else 0
            after_tax = revenue - tax
            
            worker_salary = contacts * 300 if contacts >= 10 else contacts * 200
            expense = shift.get('expense_amount', 0)
            net_profit = after_tax - worker_salary - expense
            
            kvv = round(net_profit / 2)
            kms = round(net_profit / 2)
            
            payment_icon = '💵' if payment_type == 'cash' else '💳'
            
            row = [
                shift.get('date', ''),
                time_str,
                shift.get('organization', ''),
                revenue,
                f"{payment_icon} {rate}₽",
                tax if tax > 0 else '',
                after_tax,
                shift.get('user_name', ''),
                contacts,
                worker_salary,
                expense,
                shift.get('expense_comment', ''),
                net_profit,
                kvv,
                kms,
                'Да' if shift.get('paid_by_organization', False) else 'Нет',
                'Да' if shift.get('paid_to_worker', False) else 'Нет',
                'Да' if shift.get('paid_kvv', False) else 'Нет',
                'Да' if shift.get('paid_kms', False) else 'Нет'
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