import json
import os
import psycopg2
from groq import Groq

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

ИНСТРУКЦИЯ:
Когда пользователь задаёт вопрос — сгенерируй ТОЛЬКО SQL-запрос (только SELECT, никаких INSERT/UPDATE/DELETE).
Верни ответ строго в JSON:
{{"sql": "SELECT ...", "explanation": "Что этот запрос делает"}}

Никаких лишних слов, только JSON."""


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
    """Умный ИИ-помощник: отвечает на вопросы о промоутерах через SQL"""
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

    client = Groq(api_key=os.environ['GROQ_API_KEY'])

    messages = [{'role': 'system', 'content': SYSTEM_PROMPT}]
    for h in history[-6:]:
        messages.append({'role': h['role'], 'content': h['content']})
    messages.append({'role': 'user', 'content': question})

    resp = client.chat.completions.create(
        model='llama-3.3-70b-versatile',
        messages=messages,
        temperature=0.1,
        max_tokens=1000,
    )

    raw = resp.choices[0].message.content.strip()

    try:
        parsed = json.loads(raw)
        sql = parsed.get('sql', '')
        explanation = parsed.get('explanation', '')
    except Exception:
        import re
        m = re.search(r'\{.*\}', raw, re.DOTALL)
        if m:
            parsed = json.loads(m.group())
            sql = parsed.get('sql', '')
            explanation = parsed.get('explanation', '')
        else:
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
                'answer': raw, 'sql': None, 'data': None
            })}

    sql_lower = sql.lower().strip()
    if not sql_lower.startswith('select'):
        return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
            'answer': 'Могу выполнять только SELECT-запросы.', 'sql': sql, 'data': None
        })}

    rows = run_sql(sql)
    text_result = rows_to_text(rows)

    summary_messages = [
        {'role': 'system', 'content': 'Ты помощник. Отвечай кратко и по-русски на основе данных. Без лишних слов.'},
        {'role': 'user', 'content': f'Вопрос: {question}\nРезультат из БД:\n{text_result}\n\nДай краткий человеческий ответ.'}
    ]
    summary_resp = client.chat.completions.create(
        model='llama-3.3-70b-versatile',
        messages=summary_messages,
        temperature=0.3,
        max_tokens=400,
    )
    answer = summary_resp.choices[0].message.content.strip()

    for row in rows:
        for k, v in row.items():
            if hasattr(v, 'isoformat'):
                row[k] = v.isoformat()

    return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
        'answer': answer,
        'sql': sql,
        'explanation': explanation,
        'data': rows[:20]
    }, ensure_ascii=False)}
