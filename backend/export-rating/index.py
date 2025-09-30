'''
Business: Создает лист "Рейтинг" в Google Sheets и экспортирует рейтинг пользователей
Args: event с методом POST и body с данными рейтинга пользователей
Returns: HTTP response с результатом экспорта
'''

import json
import os
from typing import Dict, Any, List
from google.oauth2.service_account import Credentials
from googleapiclient.discovery import build
from googleapiclient.errors import HttpError

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
    
    body_str = event.get('body', '{}')
    if not body_str or body_str == '':
        body_str = '{}'
    body_data = json.loads(body_str)
    user_stats: List[Dict[str, Any]] = body_data.get('user_stats', [])
    
    if not user_stats:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'User stats are required'})
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
            'body': json.dumps({'error': 'Google Sheets credentials not configured'})
        }
    
    credentials_dict = json.loads(credentials_json)
    scopes = ['https://www.googleapis.com/auth/spreadsheets']
    creds = Credentials.from_service_account_info(credentials_dict, scopes=scopes)
    service = build('sheets', 'v4', credentials=creds)
    
    try:
        # Проверяем, существует ли лист "Рейтинг"
        spreadsheet = service.spreadsheets().get(spreadsheetId=sheet_id).execute()
        sheets = spreadsheet.get('sheets', [])
        rating_sheet_exists = any(sheet['properties']['title'] == 'Рейтинг' for sheet in sheets)
        
        if not rating_sheet_exists:
            # Создаем новый лист "Рейтинг"
            request_body = {
                'requests': [{
                    'addSheet': {
                        'properties': {
                            'title': 'Рейтинг',
                            'gridProperties': {
                                'rowCount': 1000,
                                'columnCount': 6
                            }
                        }
                    }
                }]
            }
            service.spreadsheets().batchUpdate(
                spreadsheetId=sheet_id,
                body=request_body
            ).execute()
        
        # Очищаем лист "Рейтинг"
        service.spreadsheets().values().clear(
            spreadsheetId=sheet_id,
            range='Рейтинг!A:F'
        ).execute()
        
        # Подготавливаем данные для экспорта
        headers = [['Место', 'Имя', 'Email', 'Контакты', 'Подходы', 'Дубли']]
        
        # Сортируем по контактам (как в рейтинге)
        sorted_stats = sorted(user_stats, key=lambda x: x.get('contacts', 0), reverse=True)
        
        rows = []
        for index, user in enumerate(sorted_stats, start=1):
            rows.append([
                index,
                user.get('name', ''),
                user.get('email', ''),
                user.get('contacts', 0),
                user.get('approaches', 0),
                user.get('duplicates', 0)
            ])
        
        all_data = headers + rows
        
        # Записываем данные
        service.spreadsheets().values().update(
            spreadsheetId=sheet_id,
            range='Рейтинг!A1',
            valueInputOption='RAW',
            body={'values': all_data}
        ).execute()
        
        # Получаем обновленный список листов после создания
        spreadsheet_updated = service.spreadsheets().get(spreadsheetId=sheet_id).execute()
        sheets_updated = spreadsheet_updated.get('sheets', [])
        rating_sheet_id = None
        
        for sheet in sheets_updated:
            if sheet['properties']['title'] == 'Рейтинг':
                rating_sheet_id = sheet['properties']['sheetId']
                break
        
        # Форматируем заголовок (жирный шрифт) если нашли лист
        if rating_sheet_id is not None:
            format_request = {
                'requests': [{
                    'repeatCell': {
                        'range': {
                            'sheetId': rating_sheet_id,
                            'startRowIndex': 0,
                            'endRowIndex': 1
                        },
                        'cell': {
                            'userEnteredFormat': {
                                'textFormat': {
                                    'bold': True
                                }
                            }
                        },
                        'fields': 'userEnteredFormat.textFormat.bold'
                    }
                }]
            }
            
            service.spreadsheets().batchUpdate(
                spreadsheetId=sheet_id,
                body=format_request
            ).execute()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'message': 'Rating exported to Google Sheets',
                'rows_exported': len(rows)
            })
        }
        
    except HttpError as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': f'Google Sheets API error: {str(e)}'
            })
        }