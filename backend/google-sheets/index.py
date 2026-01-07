'''
Business: Экспортирует бухгалтерские данные о сменах в новый лист Google Sheets
Args: event с методом POST, body с массивом shifts, заголовок X-Session-Token для авторизации
Returns: HTTP response с URL таблицы и результатом экспорта
'''

import json
import os
from typing import Dict, Any
from datetime import datetime
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
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    headers = event.get('headers', {})
    session_token = headers.get('X-Session-Token') or headers.get('x-session-token')
    
    if not session_token:
        return {
            'statusCode': 401,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Unauthorized: No session token'})
        }
    
    body_data = json.loads(event.get('body', '{}'))
    shifts = body_data.get('shifts', [])
    
    if not shifts:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'No shifts data provided'})
        }
    
    # Логируем первую смену для диагностики
    if shifts:
        print(f"🔍 Первая смена для экспорта: {shifts[0]}")
        print(f"🔍 expense_amount в первой смене: {shifts[0].get('expense_amount', 'НЕТ ПОЛЯ')}")
    
    credentials_json = os.environ.get('GOOGLE_SHEETS_CREDENTIALS_NEW')
    sheet_id = os.environ.get('GOOGLE_SHEET_ID_NEW')
    
    if not credentials_json or not sheet_id:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Google Sheets не настроены. Обратитесь к администратору.'})
        }
    
    credentials_dict = json.loads(credentials_json)
    scopes = ['https://www.googleapis.com/auth/spreadsheets']
    creds = Credentials.from_service_account_info(credentials_dict, scopes=scopes)
    service = build('sheets', 'v4', credentials=creds)
    
    # Создаём новый лист с меткой времени
    sheet_title = f"Экспорт {datetime.now().strftime('%d.%m.%Y %H:%M')}"
    
    # Добавляем новый лист
    add_sheet_request = {
        'addSheet': {
            'properties': {
                'title': sheet_title,
                'gridProperties': {
                    'rowCount': len(shifts) + 1,
                    'columnCount': 19
                }
            }
        }
    }
    
    batch_update_response = service.spreadsheets().batchUpdate(
        spreadsheetId=sheet_id,
        body={'requests': [add_sheet_request]}
    ).execute()
    
    new_sheet_id = batch_update_response['replies'][0]['addSheet']['properties']['sheetId']
    
    # Заголовки таблицы
    headers_row = [
        'Дата', 'Сотрудник', 'Организация', 'Начало смены', 'Конец смены', 
        'Контакты', 'Ставка', 'Тип оплаты', 'Приход', 'Налог 7%', 'После налога',
        'Зарплата', 'Чистый остаток', 'КВВ', 'КМС',
        'Оплачено орг.', 'Оплачено работнику', 'Оплачено КВВ', 'Оплачено КМС'
    ]
    
    # Формируем строки данных
    data_rows = []
    for shift in shifts:
        revenue = shift.get('revenue', 0)
        tax = shift.get('tax', 0)
        after_tax = shift.get('after_tax', 0)
        worker_salary = shift.get('worker_salary', 0)
        expense = shift.get('expense_amount', 0)
        net_profit = after_tax - worker_salary - expense
        kvv = shift.get('kvv_amount', 0)
        kms = shift.get('kms_amount', 0)
        
        # Форматируем время: оставляем только часы и минуты (HH:MM)
        start_time = shift.get('start_time', '')
        end_time = shift.get('end_time', '')
        if start_time and len(start_time) > 5:
            start_time = start_time[:5]  # Берем первые 5 символов (HH:MM)
        if end_time and len(end_time) > 5:
            end_time = end_time[:5]
        
        row = [
            shift.get('date', ''),
            shift.get('user_name', ''),
            shift.get('organization', ''),
            start_time,
            end_time,
            str(shift.get('contacts_count', 0)),
            str(shift.get('contact_rate', 0)),
            'Безнал' if shift.get('payment_type') == 'cashless' else 'Нал',
            str(revenue),
            str(tax),
            str(after_tax),
            str(worker_salary),
            str(net_profit),
            str(kvv),
            str(kms),
            'Да' if shift.get('paid_by_organization') else 'Нет',
            'Да' if shift.get('paid_to_worker') else 'Нет',
            'Да' if shift.get('paid_kvv') else 'Нет',
            'Да' if shift.get('paid_kms') else 'Нет'
        ]
        data_rows.append(row)
    
    # Записываем данные
    all_data = [headers_row] + data_rows
    
    service.spreadsheets().values().update(
        spreadsheetId=sheet_id,
        range=f"'{sheet_title}'!A1",
        valueInputOption='RAW',
        body={'values': all_data}
    ).execute()
    
    # Форматирование: жирный шрифт для заголовков
    format_requests = [{
        'repeatCell': {
            'range': {
                'sheetId': new_sheet_id,
                'startRowIndex': 0,
                'endRowIndex': 1
            },
            'cell': {
                'userEnteredFormat': {
                    'textFormat': {'bold': True},
                    'backgroundColor': {'red': 0.9, 'green': 0.9, 'blue': 0.9}
                }
            },
            'fields': 'userEnteredFormat(textFormat,backgroundColor)'
        }
    }]
    
    service.spreadsheets().batchUpdate(
        spreadsheetId=sheet_id,
        body={'requests': format_requests}
    ).execute()
    
    sheet_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit#gid={new_sheet_id}"
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'success': True,
            'message': f'Экспортировано {len(shifts)} смен в новый лист "{sheet_title}"',
            'sheet_url': sheet_url
        })
    }