'''
Business: Записывает данные лида в Google Sheets таблицу
Args: event с методом POST и body с данными (promoter_name, notes, timestamp)
Returns: HTTP response с результатом записи
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
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
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
    
    body_data = json.loads(event.get('body', '{}'))
    
    promoter_name = body_data.get('promoter_name', '')
    notes = body_data.get('notes', '')
    timestamp = body_data.get('timestamp', '')
    
    if not promoter_name or not notes:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Promoter name and notes are required'})
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
    
    values = [[promoter_name, notes, timestamp]]
    body = {'values': values}
    
    result = service.spreadsheets().values().append(
        spreadsheetId=sheet_id,
        range='Sheet1!A:C',
        valueInputOption='RAW',
        body=body
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
            'message': 'Lead added to Google Sheets',
            'updatedCells': result.get('updates', {}).get('updatedCells', 0)
        })
    }