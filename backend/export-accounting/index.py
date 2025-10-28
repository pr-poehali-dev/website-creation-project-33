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
            'Дата', 'Сотрудник', 'Организация', 'Начало', 'Конец', 'Часов',
            'Контакты', 'Ставка', 'Сумма контакты', 'Тип оплаты',
            'Расходы', 'Комментарий расходов',
            'Оплачено орг.', 'Оплачено сотр.', 'КВВ', 'КМС'
        ]
        
        values = [headers]
        
        for shift in shifts:
            start_time = shift.get('start_time', '')
            end_time = shift.get('end_time', '')
            hours_worked = shift.get('hours_worked', 0)
            
            total_payment = shift.get('total_income', 0)
            
            row = [
                shift.get('date', ''),
                shift.get('user_name', ''),
                shift.get('organization_name', ''),
                start_time,
                end_time,
                f"{hours_worked:.2f}",
                str(shift.get('contacts_count', 0)),
                str(shift.get('contact_rate', 0)),
                str(total_payment),
                shift.get('payment_type', ''),
                str(shift.get('expense_amount', 0)),
                shift.get('expense_comment', ''),
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