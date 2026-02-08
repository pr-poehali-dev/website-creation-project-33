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
    
    print(f"🔑 Проверка секретов:")
    print(f"   GOOGLE_SHEETS_CREDENTIALS_NEW: {'✅ Есть' if credentials_json else '❌ Нет'}")
    print(f"   GOOGLE_SHEET_ID_NEW: {'✅ Есть (' + sheet_id + ')' if sheet_id else '❌ Нет'}")
    
    if not credentials_json or not sheet_id:
        error_msg = 'Google Sheets не настроены. '
        if not credentials_json:
            error_msg += 'Отсутствуют учетные данные (GOOGLE_SHEETS_CREDENTIALS_NEW). '
        if not sheet_id:
            error_msg += 'Отсутствует ID таблицы (GOOGLE_SHEET_ID_NEW). '
        error_msg += 'Обратитесь к администратору для настройки секретов.'
        
        print(f"❌ Ошибка: {error_msg}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': error_msg})
        }
    
    try:
        credentials_dict = json.loads(credentials_json)
        scopes = ['https://www.googleapis.com/auth/spreadsheets']
        creds = Credentials.from_service_account_info(credentials_dict, scopes=scopes)
        service = build('sheets', 'v4', credentials=creds)
        print("✅ Google API клиент успешно создан")
    except Exception as e:
        error_msg = f'Ошибка при создании клиента Google API: {str(e)}'
        print(f"❌ {error_msg}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': error_msg})
        }
    
    # Используем существующий лист "Бухучет"
    sheet_title = "Бухучет"
    
    # Получаем информацию о таблице
    try:
        spreadsheet = service.spreadsheets().get(spreadsheetId=sheet_id).execute()
        sheets = spreadsheet.get('sheets', [])
        print(f"✅ Таблица найдена, листов: {len(sheets)}")
    except Exception as e:
        error_msg = f'Не удалось получить доступ к таблице: {str(e)}. Проверьте ID таблицы и права доступа.'
        print(f"❌ {error_msg}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': error_msg})
        }
    
    # Ищем лист "Бухучет"
    target_sheet = None
    for sheet in sheets:
        if sheet['properties']['title'] == sheet_title:
            target_sheet = sheet
            break
    
    # Если листа нет - создаем его
    if not target_sheet:
        add_sheet_request = {
            'addSheet': {
                'properties': {
                    'title': sheet_title,
                    'gridProperties': {
                        'rowCount': len(shifts) + 1,
                        'columnCount': 20
                    }
                }
            }
        }
        batch_update_response = service.spreadsheets().batchUpdate(
            spreadsheetId=sheet_id,
            body={'requests': [add_sheet_request]}
        ).execute()
        sheet_id_gid = batch_update_response['replies'][0]['addSheet']['properties']['sheetId']
    else:
        sheet_id_gid = target_sheet['properties']['sheetId']
        
        # Очищаем существующие данные
        service.spreadsheets().values().clear(
            spreadsheetId=sheet_id,
            range=f"'{sheet_title}'!A1:Z"
        ).execute()
    
    # Заголовки таблицы
    headers_row = [
        'Дата', 'Сотрудник', 'Организация', 'Начало смены', 'Конец смены', 
        'Контакты', 'Ставка', 'Тип оплаты', 'Приход', 'Налог 7%', 'После налога',
        'Зарплата', 'Расход', 'Чистый остаток', 'КВВ', 'КМС',
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
            shift.get('contacts_count', 0),  # Число
            shift.get('contact_rate', 0),    # Число
            'Безнал' if shift.get('payment_type') == 'cashless' else 'Нал',
            revenue,        # Число
            tax,            # Число
            after_tax,      # Число
            worker_salary,  # Число
            expense,        # Число
            net_profit,     # Число
            kvv,            # Число
            kms,            # Число
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
        valueInputOption='USER_ENTERED',  # Автоматическое определение типов данных
        body={'values': all_data}
    ).execute()
    
    # Форматирование: жирный шрифт для заголовков
    format_requests = [{
        'repeatCell': {
            'range': {
                'sheetId': sheet_id_gid,
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
    
    sheet_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}/edit#gid={sheet_id_gid}"
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'isBase64Encoded': False,
        'body': json.dumps({
            'success': True,
            'message': f'Экспортировано {len(shifts)} смен в лист "{sheet_title}"',
            'sheet_url': sheet_url
        })
    }