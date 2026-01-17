import json
import os
import requests

def handler(event: dict, context) -> dict:
    '''Настройка webhook для Telegram бота'''
    
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    token = os.environ.get('TELEGRAM_BOT_TOKEN')
    
    if not token:
        return error_response('TELEGRAM_BOT_TOKEN not configured')
    
    try:
        query_params = event.get('queryStringParameters', {}) or {}
        action = query_params.get('action', 'status')
        
        if action == 'set_webhook':
            webhook_url = 'https://functions.poehali.dev/3866e45c-8059-4370-ba27-042c0eac094d'
            result = set_webhook(token, webhook_url)
            return success_response(result)
        
        elif action == 'get_webhook':
            result = get_webhook_info(token)
            return success_response(result)
        
        elif action == 'delete_webhook':
            result = delete_webhook(token)
            return success_response(result)
        
        elif action == 'get_me':
            result = get_bot_info(token)
            return success_response(result)
        
        else:
            return success_response({
                'message': 'Available actions: set_webhook, get_webhook, delete_webhook, get_me'
            })
            
    except Exception as e:
        return error_response(str(e))

def set_webhook(token: str, webhook_url: str) -> dict:
    '''Устанавливает webhook'''
    url = f'https://api.telegram.org/bot{token}/setWebhook'
    payload = {'url': webhook_url}
    response = requests.post(url, json=payload)
    return response.json()

def get_webhook_info(token: str) -> dict:
    '''Получает информацию о webhook'''
    url = f'https://api.telegram.org/bot{token}/getWebhookInfo'
    response = requests.get(url)
    return response.json()

def delete_webhook(token: str) -> dict:
    '''Удаляет webhook'''
    url = f'https://api.telegram.org/bot{token}/deleteWebhook'
    response = requests.post(url)
    return response.json()

def get_bot_info(token: str) -> dict:
    '''Получает информацию о боте'''
    url = f'https://api.telegram.org/bot{token}/getMe'
    response = requests.get(url)
    return response.json()

def success_response(data: dict):
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps(data, ensure_ascii=False),
        'isBase64Encoded': False
    }

def error_response(message: str):
    return {
        'statusCode': 500,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': message}),
        'isBase64Encoded': False
    }
