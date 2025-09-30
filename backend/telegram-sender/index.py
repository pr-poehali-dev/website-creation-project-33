import json
import requests
import base64
import os
import psycopg2
from datetime import datetime
from typing import Dict, Any
import pytz
from openai import OpenAI

MOSCOW_TZ = pytz.timezone('Europe/Moscow')

def get_moscow_time():
    """Получить текущее московское время"""
    utc_now = datetime.utcnow().replace(tzinfo=pytz.UTC)
    return utc_now.astimezone(MOSCOW_TZ)

def classify_lead_with_ai(notes: str) -> Dict[str, str]:
    """
    Классифицирует лид с помощью OpenAI GPT-4o-mini
    Возвращает тип и результат лида
    """
    openai_key = os.environ.get('OPENAI_API_KEY')
    if not openai_key:
        return {
            'type': 'неопределен',
            'result': 'неопределен'
        }
    
    try:
        client = OpenAI(api_key=openai_key)
        
        prompt = f"""Проанализируй отчёт промоутера и определи:

Текст отчёта: "{notes}"

Классифицируй лид по двум параметрам:

1. TYPE (тип взаимодействия):
- "подход" - промоутер подошел, но не было полноценного контакта (прошел мимо, отмахнулся)
- "контакт" - состоялся диалог, взял листовку, задал вопрос, проявил внимание
- "продажа" - купил, записался, оставил контакты, совершил целевое действие
- "отказ" - явный отказ, негатив, грубость

2. RESULT (итог взаимодействия):
- "положительный" - заинтересован, позитивная реакция
- "нейтральный" - взял информацию без энтузиазма, нейтральная реакция
- "отрицательный" - отказ, негатив, не заинтересован

Ответь СТРОГО в формате JSON без дополнительного текста:
{{"type": "контакт", "result": "положительный"}}"""

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "Ты эксперт по анализу работы промоутеров. Отвечай только JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            max_tokens=100
        )
        
        result_text = response.choices[0].message.content.strip()
        result_json = json.loads(result_text)
        
        return {
            'type': result_json.get('type', 'неопределен'),
            'result': result_json.get('result', 'неопределен')
        }
    
    except Exception as e:
        print(f"AI classification error: {e}")
        return {
            'type': 'неопределен',
            'result': 'неопределен'
        }

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: Analyze lead with AI, send to Telegram, save ONLY metrics to DB
    Args: event - dict with httpMethod, body containing notes and audio data
          context - object with request_id, function_name, memory_limit_in_mb
    Returns: HTTP response dict with status
    '''
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
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body_data = json.loads(event.get('body', '{}'))
        notes = body_data.get('notes', '').strip()
        audio_data = body_data.get('audio_data')
        user_id = event.get('headers', {}).get('X-User-Id')
        
        if not user_id:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'X-User-Id header required'})
            }
        
        if not notes and not audio_data:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Notes or audio required'})
            }
        
        bot_token = '8081347931:AAGTto62t8bmIIzdDZu5wYip0QP95JJxvIc'
        chat_id = '5215501225'
        
        classification = classify_lead_with_ai(notes)
        
        telegram_message_id = None
        
        type_emoji = {
            'подход': '👋',
            'контакт': '📞',
            'продажа': '💰',
            'отказ': '❌',
            'неопределен': '❓'
        }
        
        result_emoji = {
            'положительный': '✅',
            'нейтральный': '➖',
            'отрицательный': '❌',
            'неопределен': '❓'
        }
        
        emoji_type = type_emoji.get(classification['type'], '❓')
        emoji_result = result_emoji.get(classification['result'], '❓')
        
        caption = f"""{emoji_type} {classification['type'].upper()} {emoji_result} {classification['result']}
🎙️ IMPERIA PROMO
Промоутер ID: #{user_id}

📝 Отчёт:
{notes}"""
        
        if audio_data:
            try:
                audio_bytes = base64.b64decode(audio_data)
                
                audio_url = f'https://api.telegram.org/bot{bot_token}/sendVoice'
                
                files = {
                    'voice': ('audio.webm', audio_bytes, 'audio/webm')
                }
                data = {
                    'chat_id': chat_id,
                    'caption': caption
                }
                
                audio_response = requests.post(audio_url, files=files, data=data)
                
                if audio_response.ok:
                    telegram_message_id = audio_response.json().get('result', {}).get('message_id')
                else:
                    return {
                        'statusCode': 400,
                        'headers': {'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Failed to send to Telegram'})
                    }
            except Exception as audio_error:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': f'Audio processing error: {str(audio_error)}'})
                }
        else:
            text_url = f'https://api.telegram.org/bot{bot_token}/sendMessage'
            text_payload = {
                'chat_id': chat_id,
                'text': caption,
                'parse_mode': 'HTML'
            }
            
            text_response = requests.post(text_url, json=text_payload)
            
            if text_response.ok:
                telegram_message_id = text_response.json().get('result', {}).get('message_id')
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Failed to send to Telegram'})
                }
        
        database_url = os.environ.get('DATABASE_URL')
        if database_url:
            try:
                with psycopg2.connect(database_url) as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            """INSERT INTO leads_analytics 
                            (user_id, lead_type, lead_result, telegram_message_id, created_at) 
                            VALUES (%s, %s, %s, %s, %s)""",
                            (
                                int(user_id),
                                classification['type'],
                                classification['result'],
                                telegram_message_id,
                                get_moscow_time()
                            )
                        )
                        conn.commit()
            except Exception as db_error:
                print(f"Database error: {db_error}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'isBase64Encoded': False,
            'body': json.dumps({
                'success': True,
                'message': 'Lead analyzed and sent',
                'classification': classification
            })
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': f'Server error: {str(e)}'})
        }