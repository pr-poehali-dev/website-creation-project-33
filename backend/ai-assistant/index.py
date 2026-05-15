import json
import os
import psycopg2
import urllib.request
import re

SCHEMA = 't_p24058207_website_creation_pro'

def get_system_prompt(today: str) -> str:
    return f"""Ты — умный помощник для анализа данных команды промоутеров компании Imperia Promo.
У тебя есть доступ к PostgreSQL базе данных. Схема: {SCHEMA}

СЕГОДНЯШНЯЯ ДАТА (Москва): {today}
ВАЖНО: Все даты и время — московское (UTC+3). Для timestamp полей всегда прибавляй interval '3 hours'.

ТАБЛИЦЫ:

1. users — промоутеры
   - id, name, email, is_admin, is_active, employee_status ('intern'|'employee'), internship_shifts_completed

2. work_shifts — смены (shift_start/shift_end в UTC, shift_date — московская дата)
   - id, user_id, organization_id, shift_date (date по Москве), shift_start (UTC), shift_end (UTC)

3. leads_analytics — контакты (created_at в UTC)
   - id, user_id, organization_id, lead_type ('контакт'), is_active (bool), created_at (UTC)
   - Московская дата: (created_at + interval '3 hours')::date

4. organizations — площадки: id, name

5. accounting_expenses — бухгалтерия
   - id, user_id, work_date (московская дата), organization_id, expense_amount (расходы в руб), employee_status_at_shift ('intern'|'employee'), paid_to_worker (bool)

6. cancelled_fines — штрафы промоутеров
   - id, user_id, fine_date (московская дата), fine_type ('missed'=пропуск 1000р, 'late'=опоздание 500р, 'early'=ранний уход 500р), fine_slot ('slot1'|'slot2'), amount (сумма в руб), cancelled_at (UTC)

СТАВКИ ЗА КОНТАКТ (для расчёта зарплаты):
- Стажёр (employee_status_at_shift='intern', смены с 08.05.2026): 260 руб/контакт
- Сотрудник (employee_status_at_shift='employee'), >=10 контактов за смену: 300 руб/контакт
- Сотрудник, <10 контактов: 200 руб/контакт
- Смены до 01.10.2025: 200 руб/контакт для всех
- Зарплата = контакты * ставка. Используй work_shifts + leads_analytics для подсчёта.

ПРАВИЛА:
- Всегда используй схему {SCHEMA} перед таблицей
- Фильтр "сегодня" = дата '{today}', НЕ CURRENT_DATE
- Контакты: lead_type='контакт' AND is_active=true
- Активные промоутеры: u.is_active=true AND u.is_admin=false
- Поиск по имени: ILIKE '%имя%'
- Кто работает в день X = у кого есть запись в work_shifts со shift_date = 'X'

ПРИМЕРЫ SQL:

Контакты промоутера сегодня:
SELECT o.name, COUNT(*) as contacts FROM {SCHEMA}.leads_analytics l JOIN {SCHEMA}.users u ON u.id=l.user_id JOIN {SCHEMA}.organizations o ON o.id=l.organization_id WHERE u.name ILIKE '%Иванова%' AND l.lead_type='контакт' AND l.is_active=true AND (l.created_at + interval '3 hours')::date='{today}' GROUP BY o.name

Кто работает сегодня:
SELECT u.name, o.name as org, (ws.shift_start + interval '3 hours')::time as start, ws.shift_end IS NOT NULL as closed FROM {SCHEMA}.work_shifts ws JOIN {SCHEMA}.users u ON u.id=ws.user_id JOIN {SCHEMA}.organizations o ON o.id=ws.organization_id WHERE ws.shift_date='{today}' ORDER BY o.name

Кто работал в конкретный день (например 14.05.2026):
SELECT u.name, o.name as org, COUNT(l.id) as contacts FROM {SCHEMA}.work_shifts ws JOIN {SCHEMA}.users u ON u.id=ws.user_id JOIN {SCHEMA}.organizations o ON o.id=ws.organization_id LEFT JOIN {SCHEMA}.leads_analytics l ON l.user_id=ws.user_id AND l.organization_id=ws.organization_id AND (l.created_at+interval '3 hours')::date=ws.shift_date AND l.lead_type='контакт' AND l.is_active=true WHERE ws.shift_date='2026-05-14' GROUP BY u.name, o.name ORDER BY o.name

Штрафы промоутера:
SELECT cf.fine_date, cf.fine_type, cf.fine_slot, cf.amount FROM {SCHEMA}.cancelled_fines cf JOIN {SCHEMA}.users u ON u.id=cf.user_id WHERE u.name ILIKE '%Иванова%' ORDER BY cf.fine_date DESC

Все штрафы за неделю:
SELECT u.name, cf.fine_date, cf.fine_type, cf.amount FROM {SCHEMA}.cancelled_fines cf JOIN {SCHEMA}.users u ON u.id=cf.user_id WHERE cf.fine_date BETWEEN '{today}'::date - interval '7 days' AND '{today}'::date ORDER BY cf.fine_date DESC

Зарплата промоутера за неделю (примерная, по контактам и ставке):
SELECT ws.shift_date, o.name as org, COUNT(l.id) as contacts, ae.employee_status_at_shift, CASE WHEN ae.employee_status_at_shift='intern' THEN COUNT(l.id)*260 WHEN COUNT(l.id)>=10 THEN COUNT(l.id)*300 ELSE COUNT(l.id)*200 END as salary FROM {SCHEMA}.work_shifts ws JOIN {SCHEMA}.users u ON u.id=ws.user_id JOIN {SCHEMA}.organizations o ON o.id=ws.organization_id LEFT JOIN {SCHEMA}.leads_analytics l ON l.user_id=ws.user_id AND (l.created_at+interval '3 hours')::date=ws.shift_date AND l.lead_type='контакт' AND l.is_active=true LEFT JOIN {SCHEMA}.accounting_expenses ae ON ae.user_id=ws.user_id AND ae.work_date=ws.shift_date AND ae.organization_id=ws.organization_id WHERE u.name ILIKE '%Иванова%' AND ws.shift_date BETWEEN '{today}'::date - interval '7 days' AND '{today}'::date GROUP BY ws.shift_date, o.name, ae.employee_status_at_shift ORDER BY ws.shift_date

ИНСТРУКЦИЯ:
- "в какой организации" / "где" — включай o.name через JOIN organizations
- "кто работает" — используй work_shifts по shift_date
- "штрафы" — используй cancelled_fines
- "зарплата" — считай контакты * ставку через work_shifts + leads_analytics + accounting_expenses
- Всегда давай конкретный ответ на русском

ВИЗУАЛИЗАЦИЯ (поле chart_type):
- Если данные — рейтинг промоутеров (имя + число) → chart_type="bar"
- Если данные по датам/дням (дата + число) → chart_type="line"
- Если данные — доли/сравнение нескольких категорий → chart_type="pie"
- Если одно число или список без графика → chart_type=null

Верни строго JSON без markdown:
{{"sql": "SELECT ...", "answer": "Краткий ответ на русском", "chart_type": "bar"|"line"|"pie"|null}}

Только JSON."""


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

    from datetime import datetime, timezone, timedelta
    moscow_now = datetime.now(timezone.utc) + timedelta(hours=3)
    today = moscow_now.strftime('%Y-%m-%d')

    messages = [{'role': 'system', 'content': get_system_prompt(today)}]
    for h in history[-6:]:
        messages.append({'role': h['role'], 'content': h['content']})
    messages.append({'role': 'user', 'content': question})

    raw = ask_cf(messages)

    clean = re.sub(r'^```(?:json)?\s*|\s*```$', '', raw.strip())
    sql = ''
    ai_answer = ''
    chart_type = None
    try:
        parsed = json.loads(clean)
        sql = parsed.get('sql', '')
        ai_answer = parsed.get('answer', '')
        chart_type = parsed.get('chart_type', None)
    except Exception:
        m = re.search(r'\{.*\}', clean, re.DOTALL)
        if m:
            parsed = json.loads(m.group())
            sql = parsed.get('sql', '')
            ai_answer = parsed.get('answer', '')
            chart_type = parsed.get('chart_type', None)
        else:
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({
                'answer': raw, 'sql': None, 'data': None, 'chart_type': None
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
        'data': rows[:50],
        'chart_type': chart_type
    }, ensure_ascii=False)}