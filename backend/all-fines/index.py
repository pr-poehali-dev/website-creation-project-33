'''
Штрафы всех промоутеров за указанную неделю для админ-панели.
Args: event с queryStringParameters: week_start (YYYY-MM-DD, опционально)
Returns: список промоутеров с их штрафами и заработком по дням
'''

import json
import os
import psycopg2
from typing import Dict, Any, List
from datetime import datetime, timedelta, date


SLOT_SCHEDULE = {
    'slot1': {'start': (12, 0), 'end': (16, 0), 'label': '12:00-16:00'},
    'slot2': {'start': (16, 0), 'end': (20, 0), 'label': '16:00-20:00'},
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
    if contacts >= 10:
        return contacts * 300
    return contacts * 200


def get_slot_bounds(day_date: date, slot_key: str):
    slot = SLOT_SCHEDULE.get(slot_key)
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
    week_start = params.get('week_start')

    if not week_start:
        today = date.today()
        week_start = (today - timedelta(days=today.weekday())).isoformat()

    week_start_date = date.fromisoformat(week_start)
    week_end_date = week_start_date + timedelta(days=6)

    now_msk = datetime.utcnow() + timedelta(hours=3)

    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()

    # Все не-админ пользователи
    cur.execute("""
        SELECT id, name FROM t_p24058207_website_creation_pro.users
        WHERE is_admin = false AND is_active = true
        ORDER BY name
    """)
    users = [{'id': row[0], 'name': row[1]} for row in cur.fetchall()]
    user_ids = [u['id'] for u in users]

    if not user_ids:
        cur.close()
        conn.close()
        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'}, 'isBase64Encoded': False, 'body': json.dumps({'promoters': [], 'week_start': week_start})}

    ids_str = ','.join(str(i) for i in user_ids)

    # Контакты по дням
    cur.execute(f"""
        SELECT l.user_id, DATE(l.created_at + interval '3 hours') as d, COUNT(*) as cnt
        FROM t_p24058207_website_creation_pro.leads_analytics l
        WHERE l.user_id IN ({ids_str})
          AND l.is_active = true
          AND l.lead_type = 'контакт'
          AND DATE(l.created_at + interval '3 hours') >= '{week_start}'
          AND DATE(l.created_at + interval '3 hours') <= '{week_end_date.isoformat()}'
        GROUP BY l.user_id, d
    """)
    contacts_map: Dict[int, Dict[str, int]] = {}
    for row in cur.fetchall():
        uid, d, cnt = row[0], str(row[1]), int(row[2])
        if uid not in contacts_map:
            contacts_map[uid] = {}
        contacts_map[uid][d] = cnt

    # Смены
    cur.execute(f"""
        SELECT ws.user_id, ws.shift_date, ws.shift_start + interval '3 hours', ws.shift_end + interval '3 hours', o.name, ws.compensation_amount
        FROM t_p24058207_website_creation_pro.work_shifts ws
        JOIN t_p24058207_website_creation_pro.organizations o ON ws.organization_id = o.id
        WHERE ws.user_id IN ({ids_str})
          AND ws.shift_date >= '{week_start}'
          AND ws.shift_date <= '{week_end_date.isoformat()}'
        ORDER BY ws.shift_date, ws.shift_start
    """)
    shifts_map: Dict[int, Dict[str, List]] = {}
    for row in cur.fetchall():
        uid, shift_date = row[0], str(row[1])
        s_start = row[2]
        s_end = row[3]
        s_start_naive = s_start.replace(tzinfo=None) if s_start and hasattr(s_start, 'tzinfo') and s_start.tzinfo else s_start
        s_end_naive = s_end.replace(tzinfo=None) if s_end and hasattr(s_end, 'tzinfo') and s_end.tzinfo else s_end
        if uid not in shifts_map:
            shifts_map[uid] = {}
        if shift_date not in shifts_map[uid]:
            shifts_map[uid][shift_date] = []
        shifts_map[uid][shift_date].append({
            'start': s_start_naive,
            'end': s_end_naive,
            'org_name': row[4],
            'compensation': int(row[5] or 0)
        })

    # Расписания
    cur.execute(f"""
        SELECT user_id, schedule_data FROM t_p24058207_website_creation_pro.promoter_schedules
        WHERE user_id IN ({ids_str}) AND week_start_date = '{week_start}'
    """)
    schedules_map: Dict[int, dict] = {}
    for row in cur.fetchall():
        schedules_map[row[0]] = row[1]

    cur.close()
    conn.close()

    day_names = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    promoters_result = []

    for user in users:
        uid = user['id']
        user_contacts = contacts_map.get(uid, {})
        user_shifts = shifts_map.get(uid, {})
        schedule_data = schedules_map.get(uid, {})

        total_earnings = 0
        total_fines = 0
        days_with_fines = []

        for i in range(7):
            current_date = week_start_date + timedelta(days=i)
            date_str = current_date.isoformat()

            contacts = user_contacts.get(date_str, 0)
            day_shifts = user_shifts.get(date_str, [])
            org_name = day_shifts[0]['org_name'] if day_shifts else 'Неизвестно'
            compensation = sum(s['compensation'] for s in day_shifts)

            earnings = calculate_salary(contacts, date_str, uid, org_name) + compensation
            fines = []

            day_schedule = schedule_data.get(date_str, {}) if isinstance(schedule_data, dict) else {}
            planned_slots = sorted([slot for slot, val in day_schedule.items() if val])
            two_slots_day = len(planned_slots) == 2

            for slot_index, slot_key in enumerate(planned_slots):
                slot_start, slot_end, slot_label = get_slot_bounds(current_date, slot_key)
                if slot_start is None:
                    continue

                is_second_slot = two_slots_day and slot_index == 1
                is_first_of_two = two_slots_day and slot_index == 0

                matching_shift = None
                for s in day_shifts:
                    if s['start'] is None:
                        continue
                    if slot_start - timedelta(hours=2) <= s['start'] <= slot_end:
                        matching_shift = s
                        break

                if matching_shift is None:
                    day_end_msk = datetime(current_date.year, current_date.month, current_date.day, 20, 0)
                    if now_msk >= day_end_msk:
                        fines.append({'type': 'missed', 'amount': FINE_MISSED_SHIFT, 'label': f'Пропуск смены {slot_label}', 'time_info': 'Смена не открыта'})
                else:
                    if not is_second_slot and matching_shift['start'] > slot_start:
                        actual_time = matching_shift['start'].strftime('%H:%M')
                        fines.append({'type': 'late', 'amount': FINE_LATE_START, 'label': f'Опоздание {slot_label}', 'time_info': f'открыл в {actual_time}'})
                    if not is_first_of_two and matching_shift['end'] is not None:
                        if matching_shift['end'] < slot_end and now_msk >= slot_end:
                            actual_time = matching_shift['end'].strftime('%H:%M')
                            fines.append({'type': 'early', 'amount': FINE_EARLY_END, 'label': f'Ранний уход {slot_label}', 'time_info': f'закрыл в {actual_time}'})

            day_fines_total = sum(f['amount'] for f in fines)
            total_earnings += earnings
            total_fines += day_fines_total

            if fines or earnings > 0:
                days_with_fines.append({
                    'date': date_str,
                    'day_name': day_names[i],
                    'contacts': contacts,
                    'earnings': earnings,
                    'fines': fines,
                    'fines_total': day_fines_total,
                    'net': earnings - day_fines_total,
                    'has_shift': len(day_shifts) > 0,
                })

        if total_earnings > 0 or total_fines > 0 or days_with_fines:
            promoters_result.append({
                'user_id': uid,
                'name': user['name'],
                'total_earnings': total_earnings,
                'total_fines': total_fines,
                'total_net': total_earnings - total_fines,
                'days': days_with_fines,
            })

    # Сортируем по убыванию штрафов
    promoters_result.sort(key=lambda x: x['total_fines'], reverse=True)

    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'isBase64Encoded': False,
        'body': json.dumps({'promoters': promoters_result, 'week_start': week_start})
    }