import json
import os
import psycopg2
import requests
from datetime import date, timedelta
from typing import Dict, Any, List
from push_utils import notify_admins

SCHEMA = 't_p24058207_website_creation_pro'
BOT_TOKEN = '8081347931:AAGTto62t8bmIIzdDZu5wYip0QP95JJxvIc'
CHAT_IDS = ['5215501225', '1526249125']

SLOT_LABELS = {
    'slot1': '12:00–16:00',
    'slot2': '16:00–20:00',
}

WEEKDAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
WEEKDAYS_FULL = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье']


def send_telegram_message(text: str):
    url = f'https://api.telegram.org/bot{BOT_TOKEN}/sendMessage'
    for chat_id in CHAT_IDS:
        requests.post(url, json={
            'chat_id': chat_id,
            'text': text,
            'parse_mode': 'HTML'
        }, timeout=15)


def get_week_start(d: date) -> date:
    return d - timedelta(days=d.weekday())


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Утренний отчёт в 08:00 МСК:
    - промоутеры на точках сегодня (организация, листовки, контакты)
    - обучения сегодня
    - статистика по нехватке промоутеров на текущей неделе (с сегодня до воскресенья)
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

    week_start = get_week_start(today)
    week_end = week_start + timedelta(days=6)

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

            # === 3. Статистика по неделе (с сегодня до воскресенья) ===
            # Промоутеры в графике по дням (из promoter_schedules.schedule_data)
            cur.execute(f"""
                SELECT
                    d.date_val::text AS day,
                    COUNT(DISTINCT ps.user_id) AS promoters_in_schedule
                FROM (
                    SELECT generate_series(%s::date, %s::date, '1 day'::interval)::date AS date_val
                ) d
                LEFT JOIN {SCHEMA}.promoter_schedules ps
                    ON ps.week_start_date = %s
                    AND (
                        ps.schedule_data->(d.date_val::text)->>'slot1' = 'true'
                        OR ps.schedule_data->(d.date_val::text)->>'slot2' = 'true'
                    )
                GROUP BY d.date_val
                ORDER BY d.date_val
            """, (today, week_end, week_start))
            schedule_rows = {row[0]: int(row[1] or 0) for row in cur.fetchall()}

            # Назначенные организации по дням
            cur.execute(f"""
                SELECT date::text, COUNT(DISTINCT id) AS org_count
                FROM {SCHEMA}.planned_organizations
                WHERE date >= %s AND date <= %s
                GROUP BY date
                ORDER BY date
            """, (today, week_end))
            org_rows = {row[0]: int(row[1] or 0) for row in cur.fetchall()}

    # === Формируем сообщение ===
    day_ru = today.strftime('%d.%m.%Y')
    day_name = WEEKDAYS_FULL[today.weekday()]
    NA = '❗ Информация не заполнена!'

    lines = ['☀️ <b>Доброе утро!</b>\n']
    lines.append(f'📅 <b>{day_name}, {day_ru}</b>\n')

    # --- Промоутеры сегодня ---
    lines.append(f'👥 <b>Работают сегодня: {len(promoters)} чел.</b>')

    if promoters:
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
        for promoter_name, promoter_phone, organization, time_val, senior_name, comment in trainings:
            time_str = f' в {time_val}' if time_val else ''
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

    lines.append('')

    # --- Статистика по неделе ---
    lines.append('📆 <b>Обеспеченность до конца недели:</b>')

    all_days_ok = True
    d = today
    while d <= week_end:
        day_str = d.strftime('%Y-%m-%d')
        in_schedule = schedule_rows.get(day_str, 0)
        planned = org_rows.get(day_str, 0)
        short = planned - in_schedule
        label = f'{WEEKDAYS_SHORT[d.weekday()]} {d.strftime("%d.%m")}'

        warnings = []
        if short > 0:
            warnings.append(f'не хватает промоутеров: {short}')
        if planned < 2:
            warnings.append(f'мало организаций: {planned}')

        if planned == 0 and in_schedule == 0:
            all_days_ok = False
            lines.append(f'  ⚠️ {label}: нет данных — организации не назначены!')
        elif warnings:
            all_days_ok = False
            warn_str = ', '.join(warnings)
            lines.append(f'  ⚠️ {label}: промоутеров {in_schedule} / точек {planned} ({warn_str})')
        else:
            lines.append(f'  ✅ {label}: промоутеров {in_schedule} / точек {planned}')

        d += timedelta(days=1)

    if all_days_ok:
        lines.append('\n✅ На всю неделю промоутеров достаточно!')

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