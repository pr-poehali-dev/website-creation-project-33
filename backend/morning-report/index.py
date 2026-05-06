import json
import os
import psycopg2
import requests
from datetime import date, timedelta
from typing import Dict, Any
from push_utils import notify_admins

SCHEMA = 't_p24058207_website_creation_pro'
BOT_TOKEN = '8081347931:AAGTto62t8bmIIzdDZu5wYip0QP95JJxvIc'
CHAT_IDS = ['5215501225', '1526249125']

SLOT_LABELS = {
    'slot1': '12:00–16:00',
    'slot2': '16:00–20:00',
}

WEEKDAYS = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']


def send_telegram_message(text: str):
    url = f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage'
    for chat_id in CHAT_IDS:
        requests.post(url, json={
            'chat_id': chat_id,
            'text': text,
            'parse_mode': 'HTML'
        }, timeout=15)


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Утренний отчёт в 08:00 МСК: промоутеры на точках сегодня + обучения.
    Поддерживает ?test_date=YYYY-MM-DD для тестирования.
    """
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400'}, 'body': ''}

    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        return {'statusCode': 500, 'headers': {'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'No DATABASE_URL'})}

    params = event.get('queryStringParameters') or {}
    test_date_str = params.get('test_date')
    today = date.fromisoformat(test_date_str) if test_date_str else date.today()

    with psycopg2.connect(database_url) as conn:
        with conn.cursor() as cur:

            # === Push-уведомление ===
            notify_admins(conn, '☀️ Утренний отчёт', f'Доброе утро! Отчёт за {today.strftime("%d.%m.%Y")} готов')

            # === 1. Промоутеры на точках сегодня ===
            cur.execute(f"""
                SELECT
                    u.name AS promoter_name,
                    pp.org_name,
                    pp.address,
                    pp.leaflets,
                    pp.time_slot,
                    po.time_from,
                    po.time_to
                FROM {SCHEMA}.plan_promoters pp
                JOIN {SCHEMA}.users u ON u.id = pp.promoter_id
                JOIN {SCHEMA}.planned_organizations po ON po.id = pp.plan_id
                WHERE po.date = %s
                ORDER BY pp.time_slot, u.name
            """, (today,))
            promoters = cur.fetchall()

            # === 2. Обучения сегодня ===
            cur.execute(f"""
                SELECT promoter_name, promoter_phone, organization, time, senior_name, comment
                FROM {SCHEMA}.training_entries
                WHERE date = %s
                ORDER BY time
            """, (today,))
            trainings = cur.fetchall()

    # === Формируем сообщение ===
    day_ru = today.strftime('%d.%m.%Y')
    day_name = WEEKDAYS[today.weekday()]

    NA = '❗ Информация не заполнена!'

    lines = [f'☀️ <b>Доброе утро!</b>\n']
    lines.append(f'📅 <b>{day_name}, {day_ru}</b>\n')

    # --- Промоутеры ---
    lines.append(f'👥 <b>Работают сегодня: {len(promoters)} чел.</b>')

    if promoters:
        # Группируем по слоту
        by_slot: Dict[str, list] = {}
        for row in promoters:
            slot = row[4] or 'slot1'
            by_slot.setdefault(slot, []).append(row)

        for slot in sorted(by_slot.keys()):
            time_from = by_slot[slot][0][5]
            time_to = by_slot[slot][0][6]
            if time_from and time_to:
                slot_label = f'{str(time_from)[:5]}–{str(time_to)[:5]}'
            else:
                slot_label = SLOT_LABELS.get(slot, slot)
            lines.append(f'\n🕐 <b>{slot_label}</b>')

            for promoter_name, org_name, address, leaflets, _, tf, tt in by_slot[slot]:
                lines.append(f'\n👤 <b>{promoter_name}</b>')
                lines.append(f'🏢 Организация: {org_name if org_name else NA}')
                lines.append(f'📍 Где собирать контакты: {address if address else NA}')
                lines.append(f'📄 Где взять листовки: {leaflets if leaflets else NA}')
    else:
        lines.append('  — промоутеры не назначены')

    lines.append('')

    # --- Обучения ---
    lines.append(f'🎓 <b>Обучений сегодня: {len(trainings)}</b>')

    if trainings:
        for promoter_name, promoter_phone, organization, time, senior_name, comment in trainings:
            time_str = f' в {time}' if time else ''
            lines.append(f'\n• <b>{promoter_name}</b>{time_str}')
            lines.append(f'  📱 {promoter_phone if promoter_phone else NA}')
            if organization:
                lines.append(f'  🏢 {organization}')
            if senior_name:
                lines.append(f'  👨‍🏫 Тренер: {senior_name}')
            if comment:
                lines.append(f'  💬 {comment}')
    else:
        lines.append('  — обучений нет')

    message = '\n'.join(lines)
    send_telegram_message(message)

    return {
        'statusCode': 200,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({
            'ok': True,
            'date': str(today),
            'promoters_count': len(promoters),
            'trainings_count': len(trainings)
        })
    }