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
                    'columnCount': 15
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
        'Контакты', 'Ставка', 'Тип оплаты', 'Сумма к оплате', 
        'Расход (₽)', 'Комментарий к расходу', 
        'Оплачено орг.', 'Оплачено работнику', 'Оплачено КВВ', 'Оплачено КМС'
    ]
    
    # Формируем строки данных
    data_rows = []
    for shift in shifts:
        payment_amount = shift.get('contacts_count', 0) * shift.get('contact_rate', 0)
        
        row = [
            shift.get('date', ''),
            shift.get('user_name', ''),
            shift.get('organization', ''),
            shift.get('start_time', ''),
            shift.get('end_time', ''),
            str(shift.get('contacts_count', 0)),
            str(shift.get('contact_rate', 0)),
            'Безнал' if shift.get('payment_type') == 'cashless' else 'Нал',
            str(payment_amount),
            str(shift.get('expense_amount', 0)),
            shift.get('expense_comment', ''),
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
    
    # Проверяем и удаляем лишние строки (если таблица автоматически добавляет ИТОГО)
    current_data = service.spreadsheets().values().get(
        spreadsheetId=sheet_id,
        range=f"'{sheet_title}'!A:A"
    ).execute()
    
    actual_rows = len(current_data.get('values', []))
    expected_rows = len(shifts) + 1  # +1 для заголовка
    
    # Если строк больше ожидаемого, удаляем лишние
    if actual_rows > expected_rows:
        delete_rows_request = {
            'deleteDimension': {
                'range': {
                    'sheetId': new_sheet_id,
                    'dimension': 'ROWS',
                    'startIndex': expected_rows,
                    'endIndex': actual_rows
                }
            }
        }
        service.spreadsheets().batchUpdate(
            spreadsheetId=sheet_id,
            body={'requests': [delete_rows_request]}
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