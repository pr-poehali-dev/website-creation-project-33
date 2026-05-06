import json
import os
import psycopg2
import requests
from datetime import date, datetime, timedelta
from typing import Dict, Any

SCHEMA = 't_p24058207_website_creation_pro'
BOT_TOKEN = '8081347931:AAGTto62t8bmIIzdDZu5wYip0QP95JJxvIc'
CHAT_IDS = ['5215501225', '1526249125']


def send_telegram_message(text: str):
    url = f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage'
    for chat_id in CHAT_IDS:
        requests.post(url, json={
            'chat_id': chat_id,
            'text': text,
            'parse_mode': 'HTML'
        }, timeout=15)


def calculate_salary(contacts: int, user_id: int, org_name: str, shift_date: date) -> int:
    if user_id in (3, 9):
        return 0
    if org_name == 'Администратор':
        return 600
    cutoff = date(2025, 10, 1)
    if shift_date < cutoff:
        return contacts * 200
    if contacts >= 10:
        return contacts * 300
    return contacts * 200


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Ежедневный отчёт в 23:59: заработок за день, контакты, незаполненные слоты на завтра.
    Запускается по cron или вручную через GET-запрос.
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'No DATABASE_URL'})}

    today = date.today()
    tomorrow = today + timedelta(days=1)

    with psycopg2.connect(database_url) as conn:
        with conn.cursor() as cur:

            # === 1. Контакты за сегодня ===
            cur.execute(f"""
                SELECT u.name, COUNT(*) as cnt
                FROM {SCHEMA}.leads_analytics la
                JOIN {SCHEMA}.users u ON u.id = la.user_id
                WHERE la.is_active = true
                  AND la.lead_type = 'контакт'
                  AND DATE(la.created_at + interval '3 hours') = %s
                GROUP BY u.name
                ORDER BY cnt DESC
            """, (today,))
            contacts_rows = cur.fetchall()
            total_contacts = sum(r[1] for r in contacts_rows)

            # === 2. Заработок за сегодня ===
            cur.execute(f"""
                SELECT ws.user_id, u.name, o.name as org_name,
                       COALESCE(ws.compensation_amount, 0) as compensation
                FROM {SCHEMA}.work_shifts ws
                JOIN {SCHEMA}.users u ON u.id = ws.user_id
                JOIN {SCHEMA}.organizations o ON o.id = ws.organization_id
                WHERE ws.shift_date = %s
            """, (today,))
            shifts_today = cur.fetchall()

            cur.execute(f"""
                SELECT la.user_id, COUNT(*) as cnt
                FROM {SCHEMA}.leads_analytics la
                WHERE la.is_active = true
                  AND la.lead_type = 'контакт'
                  AND DATE(la.created_at + interval '3 hours') = %s
                GROUP BY la.user_id
            """, (today,))
            contacts_by_user = {r[0]: r[1] for r in cur.fetchall()}

            earnings_by_user: Dict[str, int] = {}
            for user_id, user_name, org_name, compensation in shifts_today:
                contacts = contacts_by_user.get(user_id, 0)
                salary = calculate_salary(contacts, user_id, org_name, today)
                total = salary + compensation
                if total > 0:
                    earnings_by_user[user_name] = earnings_by_user.get(user_name, 0) + total

            total_earnings = sum(earnings_by_user.values())

            # === 3. Незаполненные слоты на завтра ===
            # Ищем planned_organizations на завтра
            cur.execute(f"""
                SELECT po.id, o.name as org_name, po.time_from, po.time_to
                FROM {SCHEMA}.planned_organizations po
                JOIN {SCHEMA}.organizations o ON o.id = po.organization_id
                WHERE po.date = %s
            """, (tomorrow,))
            plans_tomorrow = cur.fetchall()

            # Для каждого плана смотрим назначены ли промоутеры
            cur.execute(f"""
                SELECT pp.plan_id, u.name as promoter_name, pp.time_slot
                FROM {SCHEMA}.plan_promoters pp
                JOIN {SCHEMA}.users u ON u.id = pp.promoter_id
                WHERE pp.plan_id IN (
                    SELECT id FROM {SCHEMA}.planned_organizations WHERE date = %s
                )
            """, (tomorrow,))
            assigned_rows = cur.fetchall()

            assigned_by_plan: Dict[int, list] = {}
            for plan_id, pname, slot in assigned_rows:
                assigned_by_plan.setdefault(plan_id, []).append(pname)

            empty_slots = []
            for plan_id, org_name, time_from, time_to in plans_tomorrow:
                assignees = assigned_by_plan.get(plan_id, [])
                if not assignees:
                    time_label = ''
                    if time_from and time_to:
                        tf = str(time_from)[:5]
                        tt = str(time_to)[:5]
                        time_label = f' {tf}–{tt}'
                    empty_slots.append(f'• {org_name}{time_label}')

    # === Формируем сообщение ===
    day_ru = today.strftime('%d.%m.%Y')
    tomorrow_ru = tomorrow.strftime('%d.%m.%Y')
    weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    day_name = weekdays[today.weekday()]
    tomorrow_name = weekdays[tomorrow.weekday()]

    lines = [f'📊 <b>Итоги дня — {day_ru} ({day_name})</b>\n']

    # Контакты
    lines.append(f'👥 <b>Контакты за день: {total_contacts}</b>')
    for name, cnt in contacts_rows[:8]:
        lines.append(f'  • {name}: {cnt}')
    if not contacts_rows:
        lines.append('  — нет контактов')
    lines.append('')

    # Заработок
    lines.append(f'💰 <b>Заработок за день: {total_earnings:,} ₽</b>'.replace(',', ' '))
    for name, amount in sorted(earnings_by_user.items(), key=lambda x: -x[1])[:8]:
        lines.append(f'  • {name}: {amount:,} ₽'.replace(',', ' '))
    if not earnings_by_user:
        lines.append('  — данных нет')
    lines.append('')

    # Незаполненные слоты
    lines.append(f'📅 <b>Завтра ({tomorrow_ru}, {tomorrow_name}) — незаполненные слоты:</b>')
    if empty_slots:
        lines.append('❗ Нет промоутера:')
        for s in empty_slots[:10]:
            lines.append(s)
    else:
        lines.append('✅ Все слоты заполнены')

    message = '\n'.join(lines)
    send_telegram_message(message)

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({
            'ok': True,
            'date': str(today),
            'total_contacts': total_contacts,
            'total_earnings': total_earnings,
            'empty_slots_tomorrow': len(empty_slots)
        })
    }
