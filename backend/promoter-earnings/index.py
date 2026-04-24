'''
Заработок промоутера по дням текущей недели с учётом штрафов.
Args: event с queryStringParameters: user_id, week_start (YYYY-MM-DD)
Returns: данные о заработке по дням, штрафы, итог
'''

import json
import os
import psycopg2
from typing import Dict, Any, List
from datetime import datetime, timedelta, date


SLOT_SCHEDULE = {
    'weekday': {
        'slot1': {'start': (12, 0), 'end': (16, 0), 'label': '12:00-16:00'},
        'slot2': {'start': (16, 0), 'end': (20, 0), 'label': '16:00-20:00'},
    },
    'weekend': {
        'slot1': {'start': (12, 0), 'end': (16, 0), 'label': '12:00-16:00'},
        'slot2': {'start': (16, 0), 'end': (20, 0), 'label': '16:00-20:00'},
    }
}

FINE_MISSED_SHIFT = 1000
FINE_LATE_START = 500
FINE_EARLY_END = 500


def calculate_salary(contacts: int, shift_date_str: str, user_id: int, org_name: str) -> int:
    if user_id in (3, 9):
        return 0
    if org_name == 'Администратор':
        return 600
    cutoff = date(2025, 10, 1)
    d = date.fromisoformat(shift_date_str)
    if d < cutoff:
        return contacts * 200
    if contacts <= 10:
        return contacts * 200
    return 10 * 200 + (contacts - 10) * 300


def get_slot_bounds(day_date: date, slot_key: str):
    is_weekend = day_date.weekday() >= 5
    day_type = 'weekend' if is_weekend else 'weekday'
    slot = SLOT_SCHEDULE[day_type].get(slot_key)
    if not slot:
        return None, None, ''
    start = datetime(day_date.year, day_date.month, day_date.day, slot['start'][0], slot['start'][1])
    end = datetime(day_date.year, day_date.month, day_date.day, slot['end'][0], slot['end'][1])
    return start, end, slot['label']


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'GET')

    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }

    params = event.get('queryStringParameters') or {}
    user_id = params.get('user_id')
    week_start = params.get('week_start')

    if not user_id:
        return {'statusCode': 400, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'body': json.dumps({'error': 'user_id required'})}

    user_id = int(user_id)

    if not week_start:
        today = date.today()
        week_start = (today - timedelta(days=today.weekday())).isoformat()

    week_start_date = date.fromisoformat(week_start)
    week_end_date = week_start_date + timedelta(days=6)

    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    # Получаем контакты по дням за неделю
    cur.execute("""
        SELECT DATE(l.created_at + interval '3 hours') as d, COUNT(*) as cnt
        FROM t_p24058207_website_creation_pro.leads_analytics l
        WHERE l.user_id = %s
          AND l.is_active = true
          AND l.lead_type = 'контакт'
          AND DATE(l.created_at + interval '3 hours') >= %s
          AND DATE(l.created_at + interval '3 hours') <= %s
        GROUP BY d
        ORDER BY d
    """, (user_id, week_start, week_end_date.isoformat()))
    contacts_by_day = {str(row[0]): int(row[1]) for row in cur.fetchall()}

    # Организация для промоутера (последняя из смен недели)
    cur.execute("""
        SELECT ws.shift_date, ws.shift_start, ws.shift_end, o.name, ws.compensation_amount
        FROM t_p24058207_website_creation_pro.work_shifts ws
        JOIN t_p24058207_website_creation_pro.organizations o ON ws.organization_id = o.id
        WHERE ws.user_id = %s
          AND ws.shift_date >= %s
          AND ws.shift_date <= %s
        ORDER BY ws.shift_date, ws.shift_start
    """, (user_id, week_start, week_end_date.isoformat()))
    shifts_rows = cur.fetchall()

    shifts_by_day: Dict[str, List[dict]] = {}
    for row in shifts_rows:
        d = str(row[0])
        shift_start_utc = row[1]
        shift_end_utc = row[2]
        # UTC -> MSK (+3h)
        shift_start_msk = (shift_start_utc + timedelta(hours=3)) if shift_start_utc else None
        shift_end_msk = (shift_end_utc + timedelta(hours=3)) if shift_end_utc else None
        if d not in shifts_by_day:
            shifts_by_day[d] = []
        shifts_by_day[d].append({
            'start': shift_start_msk,
            'end': shift_end_msk,
            'org_name': row[3],
            'compensation': int(row[4] or 0)
        })

    # Расписание (запланированные смены)
    cur.execute("""
        SELECT schedule_data FROM t_p24058207_website_creation_pro.promoter_schedules
        WHERE user_id = %s AND week_start_date = %s
    """, (user_id, week_start))
    sched_row = cur.fetchone()
    schedule_data = sched_row[0] if sched_row else {}

    cur.close()
    conn.close()

    day_names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    days_result = []
    total_earnings = 0
    total_fines = 0

    for i in range(7):
        current_date = week_start_date + timedelta(days=i)
        date_str = current_date.isoformat()
        is_weekend = current_date.weekday() >= 5

        contacts = contacts_by_day.get(date_str, 0)
        day_shifts = shifts_by_day.get(date_str, [])

        # Определяем организацию (из смены или None)
        org_name = day_shifts[0]['org_name'] if day_shifts else 'Неизвестно'
        compensation = sum(s['compensation'] for s in day_shifts)

        earnings = calculate_salary(contacts, date_str, user_id, org_name) + compensation
        fines = []

        # Запланированные слоты на этот день
        day_schedule = schedule_data.get(date_str, {}) if isinstance(schedule_data, dict) else {}
        planned_slots = [slot for slot, val in day_schedule.items() if val]

        for slot_key in planned_slots:
            slot_start, slot_end, slot_label = get_slot_bounds(current_date, slot_key)
            if slot_start is None:
                continue

            # Ищем смену в этот слот (открытую в ±2ч от начала слота)
            matching_shift = None
            for s in day_shifts:
                if s['start'] is None:
                    continue
                shift_start_naive = s['start'].replace(tzinfo=None) if hasattr(s['start'], 'tzinfo') and s['start'].tzinfo else s['start']
                # Смена относится к этому слоту если старт в пределах слота ±2ч
                if slot_start - timedelta(hours=2) <= shift_start_naive <= slot_end:
                    matching_shift = s
                    break

            if matching_shift is None:
                # Штраф за пропуск смены (если день уже прошёл)
                if current_date < date.today():
                    fines.append({'type': 'missed', 'amount': FINE_MISSED_SHIFT, 'label': f'Пропуск смены {slot_label}'})
            else:
                shift_start_naive = matching_shift['start'].replace(tzinfo=None) if hasattr(matching_shift['start'], 'tzinfo') and matching_shift['start'].tzinfo else matching_shift['start']
                # Штраф за опоздание (старт после slot_start)
                if shift_start_naive > slot_start:
                    fines.append({'type': 'late', 'amount': FINE_LATE_START, 'label': f'Опоздание {slot_label}'})

                # Штраф за ранний уход (конец до slot_end)
                if matching_shift['end'] is not None:
                    shift_end_naive = matching_shift['end'].replace(tzinfo=None) if hasattr(matching_shift['end'], 'tzinfo') and matching_shift['end'].tzinfo else matching_shift['end']
                    if shift_end_naive < slot_end:
                        fines.append({'type': 'early', 'amount': FINE_EARLY_END, 'label': f'Ранний уход {slot_label}'})

        day_fines_total = sum(f['amount'] for f in fines)
        net = earnings - day_fines_total
        total_earnings += earnings
        total_fines += day_fines_total

        days_result.append({
            'date': date_str,
            'day_name': day_names[i],
            'contacts': contacts,
            'earnings': earnings,
            'fines': fines,
            'fines_total': day_fines_total,
            'net': net,
            'has_shift': len(day_shifts) > 0,
            'is_today': current_date == date.today(),
            'is_future': current_date > date.today(),
        })

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({
            'days': days_result,
            'week_start': week_start,
            'total_earnings': total_earnings,
            'total_fines': total_fines,
            'total_net': total_earnings - total_fines
        })
    }