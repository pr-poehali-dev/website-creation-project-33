import json
import os
import psycopg2
import urllib.request
import re

SCHEMA = 't_p24058207_website_creation_pro'

SYSTEM_PROMPT = f"""Ты — умный помощник для анализа данных команды промоутеров компании Imperia Promo.
У тебя есть доступ к PostgreSQL базе данных. Схема: {SCHEMA}

ТАБЛИЦЫ:

1. users — промоутеры
   - id, name, email, is_admin, is_active, employee_status ('intern'|'employee'), internship_shifts_completed, last_seen, created_at

2. work_shifts — смены промоутеров
   - id, user_id, organization_id, shift_date (date), shift_start (timestamp), shift_end (timestamp)

3. leads_analytics — контакты и подходы
   - id, user_id, organization_id, lead_type ('контакт'|'подход'), is_active (bool), created_at
   - Контакты = lead_type = 'контакт' AND is_active = true

4. organizations — площадки/организации
   - id, name

5. accounting_expenses — бухгалтерия
   - id, user_id, work_date, organization_id, expense_amount, employee_status_at_shift, paid_to_worker

6. training_seniors — старшие промоутеры
   - id, name

ПРАВИЛА:
- Всегда используй схему {SCHEMA} перед именем таблицы
- Время хранится в UTC, московское = UTC+3 (используй AT TIME ZONE 'Europe/Moscow' или + interval '3 hours')
- Для подсчёта контактов: COUNT(*) FROM leads_analytics WHERE lead_type='контакт' AND is_active=true
- Для смен: используй work_shifts, shift_date — дата смены по Москве
- Активные промоутеры: is_active=true AND is_admin=false
- "Сегодня" = (CURRENT_TIMESTAMP AT TIME ZONE 'Europe/Moscow')::date

ИНСТРУКЦИЯ:
Когда пользователь задаёт вопрос:
1. Сгенерируй SQL-запрос (только SELECT, никаких INSERT/UPDATE/DELETE)
2. Выполни его мысленно и сформулируй ответ

Верни ответ строго в JSON без markdown-блоков:
{{"sql": "SELECT ...", "answer": "Краткий человеческий ответ на русском на основе данных"}}

Никаких лишних слов, только JSON."""


def ask_cf(messages: list) -> str:
    account_id = os.environ['CLOUDFLARE_ACCOUNT_ID']
    api_token = os.environ['CLOUDFLARE_API_TOKEN']
    url = f"https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/meta/llama-3.1-8b-instruct"

    cf_messages = []
    for m in messages:
        role = 'assistant' if m['role'] == 'assistant' else m['role']
        cf_messages.append({'role': role, 'content': m['content']})

    body = json.dumps({'messages': cf_messages, 'max_tokens': 1000, 'temperature': 0.1}).encode('utf-8')
    req = urllib.request.Request(
        url, data=body,
        headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {api_token}'},
        method='POST'
    )
    try:
        with urllib.request.urlopen(req, timeout=25) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        err_body = e.read().decode('utf-8', errors='ignore')
        raise Exception(f"Cloudflare HTTP {e.code}: {err_body}")
    return result['result']['response'].strip()


def get_db():
    return psycopg2.connect(os.environ['DATABASE_URL'])


def run_sql(sql: str) -> list:
    with get_db() as conn:
        with conn.cursor() as cur:
            cur.execute(sql)
            cols = [d[0] for d in cur.description]
            rows = cur.fetchmany(100)
            return [dict(zip(cols, row)) for row in rows]


def format_value(v):
    if v is None:
        return '—'
    if hasattr(v, 'isoformat'):
        return v.isoformat()
    return str(v)


def rows_to_text(rows: list) -> str:
    if not rows:
        return 'Нет данных'
    if len(rows) == 1 and len(rows[0]) == 1:
        v = list(rows[0].values())[0]
        return format_value(v)
    lines = []
    for r in rows[:50]:
        parts = [f"{k}: {format_value(v)}" for k, v in r.items()]
        lines.append(' | '.join(parts))
    result = '\n'.join(lines)
    if len(rows) > 50:
        result += f'\n...и ещё {len(rows) - 50} строк'
    return result


def handler(event: dict, context) -> dict:
    """Умный ИИ-помощник: отвечает на вопросы о промоутерах через SQL + Gemini"""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
        'Content-Type': 'application/json'
    }

    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}

    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'headers': headers, 'body': json.dumps({'error': 'Method not allowed'})}

    body = json.loads(event.get('body') or '{}')
    question = (body.get('question') or '').strip()
    history = body.get('history') or []

    if not question:
        return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Вопрос не указан'})}

    messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    for h in history[-6:]:
        messages.append({'role': h['role'], 'content': h['content']})
    messages.append({'role': 'user', 'content': question})

    raw = ask_cf(messages)

    clean = re.sub(r'^```(?:json)?\s*|\s*```$', '', raw.strip())
    sql = ''
    ai_answer = ''
    try:
        parsed = json.loads(clean)
        sql = parsed.get('sql', '')
        ai_answer = parsed.get('answer', '')
    except Exception:
        m = re.search(r'\{.*\}', clean, re.DOTALL)
        if m:
            parsed = json.loads(m.group())
            sql = parsed.get('sql', '')
            ai_answer = parsed.get('answer', '')
        else:
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
                'answer': raw, 'sql': None, 'data': None
            }, ensure_ascii=False)}

    if not sql.lower().strip().startswith('select'):
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
            'answer': 'Могу выполнять только SELECT-запросы.', 'sql': sql, 'data': None
        }, ensure_ascii=False)}

    rows = run_sql(sql)
    text_result = rows_to_text(rows)

    # Если ИИ не дал ответ — формируем из данных БД
    answer = ai_answer if ai_answer else text_result

    for row in rows:
        for k, v in row.items():
            if hasattr(v, 'isoformat'):
                row[k] = v.isoformat()

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
        'answer': answer,
        'sql': sql,
        'explanation': '',
        'data': rows[:20]
    }, ensure_ascii=False)}