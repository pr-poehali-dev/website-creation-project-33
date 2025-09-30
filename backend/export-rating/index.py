'''
Business: Экспортирует полную статистику (общую, рейтинги, дневную статистику, график) в Google Sheets
Args: event с методом POST и body с данными статистики
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
    
    total_leads = body_data.get('total_leads', 0)
    contacts = body_data.get('contacts', 0)
    approaches = body_data.get('approaches', 0)
    user_stats: List[Dict[str, Any]] = body_data.get('user_stats', [])
    daily_stats: List[Dict[str, Any]] = body_data.get('daily_stats', [])
    chart_data: List[Dict[str, Any]] = body_data.get('chart_data', [])
    
    if not user_stats:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Statistics data are required'})
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
        spreadsheet = service.spreadsheets().get(spreadsheetId=sheet_id).execute()
        sheets = spreadsheet.get('sheets', [])
        
        sheets_to_create = []
        existing_sheet_titles = [s['properties']['title'] for s in sheets]
        
        for sheet_name in ['Общая статистика', 'Рейтинг по контактам', 'Рейтинг по подходам', 'Статистика по дням', 'График лидов']:
            if sheet_name not in existing_sheet_titles:
                sheets_to_create.append({
                    'addSheet': {
                        'properties': {
                            'title': sheet_name,
                            'gridProperties': {'rowCount': 1000, 'columnCount': 10}
                        }
                    }
                })
        
        if sheets_to_create:
            service.spreadsheets().batchUpdate(
                spreadsheetId=sheet_id,
                body={'requests': sheets_to_create}
            ).execute()
        
        # 1. Общая статистика
        overview_data = [
            ['Метрика', 'Значение'],
            ['Всего лидов', total_leads],
            ['Контакты', contacts],
            ['Подходы', approaches]
        ]
        service.spreadsheets().values().clear(
            spreadsheetId=sheet_id, range='Общая статистика!A:B'
        ).execute()
        service.spreadsheets().values().update(
            spreadsheetId=sheet_id,
            range='Общая статистика!A1',
            valueInputOption='RAW',
            body={'values': overview_data}
        ).execute()
        
        # 2. Рейтинг по контактам
        sorted_by_contacts = sorted(user_stats, key=lambda x: x.get('contacts', 0), reverse=True)
        contacts_data = [['Место', 'Имя', 'Email', 'Контакты', 'Подходы', 'Дубли']]
        for index, user in enumerate(sorted_by_contacts, start=1):
            contacts_data.append([
                index,
                user.get('name', ''),
                user.get('email', ''),
                user.get('contacts', 0),
                user.get('approaches', 0),
                user.get('duplicates', 0)
            ])
        service.spreadsheets().values().clear(
            spreadsheetId=sheet_id, range='Рейтинг по контактам!A:F'
        ).execute()
        service.spreadsheets().values().update(
            spreadsheetId=sheet_id,
            range='Рейтинг по контактам!A1',
            valueInputOption='RAW',
            body={'values': contacts_data}
        ).execute()
        
        # 3. Рейтинг по подходам
        sorted_by_approaches = sorted(user_stats, key=lambda x: x.get('approaches', 0), reverse=True)
        approaches_data = [['Место', 'Имя', 'Email', 'Контакты', 'Подходы', 'Дубли']]
        for index, user in enumerate(sorted_by_approaches, start=1):
            approaches_data.append([
                index,
                user.get('name', ''),
                user.get('email', ''),
                user.get('contacts', 0),
                user.get('approaches', 0),
                user.get('duplicates', 0)
            ])
        service.spreadsheets().values().clear(
            spreadsheetId=sheet_id, range='Рейтинг по подходам!A:F'
        ).execute()
        service.spreadsheets().values().update(
            spreadsheetId=sheet_id,
            range='Рейтинг по подходам!A1',
            valueInputOption='RAW',
            body={'values': approaches_data}
        ).execute()
        
        # 4. Статистика по дням
        daily_data = [['Дата', 'Всего лидов', 'Контакты', 'Подходы']]
        for day in daily_stats:
            daily_data.append([
                day.get('date', ''),
                day.get('count', 0),
                day.get('contacts', 0),
                day.get('approaches', 0)
            ])
        service.spreadsheets().values().clear(
            spreadsheetId=sheet_id, range='Статистика по дням!A:D'
        ).execute()
        service.spreadsheets().values().update(
            spreadsheetId=sheet_id,
            range='Статистика по дням!A1',
            valueInputOption='RAW',
            body={'values': daily_data}
        ).execute()
        
        # 5. График лидов
        if chart_data:
            chart_headers = ['Дата', 'Всего', 'Контакты', 'Подходы']
            chart_rows = []
            for point in chart_data:
                chart_rows.append([
                    point.get('date', ''),
                    point.get('total', 0),
                    point.get('contacts', 0),
                    point.get('approaches', 0)
                ])
            chart_export = [chart_headers] + chart_rows
            service.spreadsheets().values().clear(
                spreadsheetId=sheet_id, range='График лидов!A:D'
            ).execute()
            service.spreadsheets().values().update(
                spreadsheetId=sheet_id,
                range='График лидов!A1',
                valueInputOption='RAW',
                body={'values': chart_export}
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
                'message': 'Full statistics exported to Google Sheets',
                'sheets_created': 5,
                'users_exported': len(user_stats)
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
