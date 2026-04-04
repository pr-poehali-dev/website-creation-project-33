'''
Функции администратора для управления пользователями и статистикой
ВАЖНО: Работает с leads_analytics (только метрики), полные лиды в Telegram!
Args: event с httpMethod, body, headers; context с request_id
Returns: JSON с данными пользователей, статистикой лидов
'''

import json
import os
import psycopg2
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import pytz

MOSCOW_TZ = pytz.timezone('Europe/Moscow')

def get_moscow_time():
    """Получить текущее московское время"""
    utc_now = datetime.utcnow().replace(tzinfo=pytz.UTC)
    return utc_now.astimezone(MOSCOW_TZ)

def get_db_connection():
    """Получить подключение к базе данных"""
    database_url = os.environ.get('DATABASE_URL')
    if not database_url:
        raise Exception('DATABASE_URL not found in environment')
    return psycopg2.connect(database_url)

def get_user_by_session(session_token: str) -> Optional[Dict[str, Any]]:
    """Получить пользователя по токену сессии"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.id, u.email, u.name, u.is_admin 
                FROM t_p24058207_website_creation_pro.users u 
                JOIN t_p24058207_website_creation_pro.user_sessions s ON u.id = s.user_id 
                WHERE s.session_token = %s AND s.expires_at > NOW()
            """, (session_token,))
            
            row = cur.fetchone()
            if row:
                return {
                    'id': row[0],
                    'email': row[1], 
                    'name': row[2],
                    'is_admin': row[3]
                }
    return None

def get_all_users(is_active: bool = True) -> List[Dict[str, Any]]:
    """Получить пользователей с информацией об онлайн статусе и количеством лидов"""
    online_threshold = get_moscow_time() - timedelta(minutes=5)
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.id, u.email, u.name, u.is_admin, u.last_seen, u.created_at,
                       CASE WHEN u.last_seen > %s THEN true ELSE false END as is_online,
                       COUNT(l.id) as lead_count,
                       u.latitude, u.longitude, u.location_city, u.location_country,
                       u.registration_ip, u.is_active
                FROM t_p24058207_website_creation_pro.users u 
                LEFT JOIN t_p24058207_website_creation_pro.leads_analytics l ON u.id = l.user_id AND l.is_active = true
                WHERE u.is_active = %s
                GROUP BY u.id, u.email, u.name, u.is_admin, u.last_seen, u.created_at, u.latitude, u.longitude, u.location_city, u.location_country, u.registration_ip, u.is_active
                ORDER BY u.created_at DESC
            """, (online_threshold, is_active))
            
            users = []
            for row in cur.fetchall():
                users.append({
                    'id': row[0],
                    'email': row[1],
                    'name': row[2],
                    'is_admin': row[3],
                    'last_seen': row[4].isoformat() if row[4] else None,
                    'created_at': row[5].isoformat() if row[5] else None,
                    'is_online': row[6],
                    'lead_count': row[7],
                    'latitude': row[8],
                    'longitude': row[9],
                    'location_city': row[10],
                    'location_country': row[11],
                    'registration_ip': row[12],
                    'is_active': row[13]
                })
            
            # Получаем ВСЕ лиды для активных пользователей одним запросом
            if users:
                user_ids = [user['id'] for user in users if user['lead_count'] > 0]
                
                if user_ids:
                    # Плейсхолдеры для IN clause
                    placeholders = ','.join(['%s'] * len(user_ids))
                    cur.execute(f"""
                        SELECT l.user_id, l.created_at, l.organization_id
                        FROM t_p24058207_website_creation_pro.leads_analytics l
                        WHERE l.user_id IN ({placeholders}) AND l.is_active = true
                        ORDER BY l.user_id, l.created_at DESC
                    """, tuple(user_ids))
                    
                    # Группируем лиды по пользователям
                    user_leads_map = {}
                    for lead_row in cur.fetchall():
                        user_id = lead_row[0]
                        if user_id not in user_leads_map:
                            user_leads_map[user_id] = []
                        user_leads_map[user_id].append((lead_row[1], lead_row[2]))
                    
                    # Вычисляем смены для каждого пользователя
                    for user in users:
                        if user['id'] in user_leads_map:
                            shift_combinations = set()
                            last_shift_date = None
                            
                            for created_at, org_id in user_leads_map[user['id']]:
                                moscow_dt = get_moscow_time_from_utc(created_at)
                                moscow_date = moscow_dt.date()
                                shift_combinations.add((moscow_date, org_id))
                                if last_shift_date is None:
                                    last_shift_date = moscow_date
                            
                            shifts = len(shift_combinations)
                            avg_per_shift = round(user['lead_count'] / shifts) if shifts > 0 else 0
                            user['shifts_count'] = shifts
                            user['avg_per_shift'] = avg_per_shift
                            user['last_shift_date'] = last_shift_date.isoformat() if last_shift_date else None
                        else:
                            user['shifts_count'] = 0
                            user['avg_per_shift'] = 0
                            user['last_shift_date'] = None
                else:
                    # Нет пользователей с лидами
                    for user in users:
                        user['shifts_count'] = 0
                        user['avg_per_shift'] = 0
                        user['last_shift_date'] = None
    return users

def get_moscow_time_from_utc(utc_time):
    """Конвертировать UTC время в московское"""
    if utc_time.tzinfo is None:
        utc_time = utc_time.replace(tzinfo=pytz.UTC)
    return utc_time.astimezone(MOSCOW_TZ)

def get_leads_stats() -> Dict[str, Any]:
    """Получить статистику по лидам из work_shifts (только подтверждённые смены)"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Контакты из подтверждённых смен (как в бухучёте)
            # Подходы теперь = количество 'подход' + количество 'контакт'
            cur.execute("""
                SELECT COUNT(CASE WHEN l.lead_type = 'контакт' THEN 1 END) as contacts,
                       COUNT(CASE WHEN l.lead_type IN ('подход', 'контакт') THEN 1 END) as approaches,
                       COUNT(*) as total
                FROM t_p24058207_website_creation_pro.work_shifts s
                JOIN t_p24058207_website_creation_pro.users u ON s.user_id = u.id
                LEFT JOIN t_p24058207_website_creation_pro.leads_analytics l 
                    ON l.user_id = s.user_id 
                    AND l.created_at::date = s.shift_date
                    AND l.organization_id = s.organization_id
                    AND l.is_active = true
                WHERE s.shift_date >= '2025-01-01'
            """)
            row = cur.fetchone()
            contacts = row[0] if row[0] else 0
            approaches = row[1] if row[1] else 0
            total_leads = row[2] if row[2] else 0
            
            # Получаем все смены
            cur.execute("""
                SELECT 
                    user_id,
                    shift_date,
                    organization_id
                FROM t_p24058207_website_creation_pro.work_shifts
                WHERE shift_date >= '2025-01-01'
            """)
            shifts_data = cur.fetchall()
            
            # Получаем все лиды для подсчёта
            cur.execute("""
                SELECT 
                    user_id,
                    organization_id,
                    created_at,
                    lead_type
                FROM t_p24058207_website_creation_pro.leads_analytics
                WHERE is_active = true AND created_at >= '2024-12-31 21:00:00'
            """)
            leads_data = cur.fetchall()
            
            # Подсчитываем контакты по сменам с конвертацией в московское время
            shift_contacts_map = {}
            for lead_row in leads_data:
                user_id = lead_row[0]
                org_id = lead_row[1]
                created_at_utc = lead_row[2]
                lead_type = lead_row[3]
                
                if created_at_utc.tzinfo is None:
                    created_at_utc = created_at_utc.replace(tzinfo=pytz.UTC)
                created_at_moscow = created_at_utc.astimezone(MOSCOW_TZ)
                shift_date = created_at_moscow.date()
                
                key = (user_id, shift_date, org_id)
                if key not in shift_contacts_map:
                    shift_contacts_map[key] = 0
                
                if lead_type == 'контакт':
                    shift_contacts_map[key] += 1
            
            # Группируем данные по пользователям
            user_data_map = {}
            for shift_row in shifts_data:
                user_id = shift_row[0]
                shift_date = shift_row[1]
                org_id = shift_row[2]
                
                if user_id not in user_data_map:
                    user_data_map[user_id] = {
                        'shifts': set(),
                        'contacts': 0,
                        'max_contacts': 0,
                        'shift_contacts_list': []
                    }
                
                user_data_map[user_id]['shifts'].add((shift_date, org_id))
                
                key = (user_id, shift_date, org_id)
                shift_contacts_count = shift_contacts_map.get(key, 0)
                user_data_map[user_id]['contacts'] += shift_contacts_count
                user_data_map[user_id]['shift_contacts_list'].append(shift_contacts_count)
                if shift_contacts_count > user_data_map[user_id]['max_contacts']:
                    user_data_map[user_id]['max_contacts'] = shift_contacts_count
            
            # Получаем дополнительные данные: имена, email, подходы, зарплата
            cur.execute("""
                WITH user_salary AS (
                    SELECT 
                        ws.user_id,
                        SUM(
                            CASE 
                                WHEN shift_contacts.contacts_count >= 10 THEN shift_contacts.contacts_count * 300
                                ELSE shift_contacts.contacts_count * 200
                            END
                        ) as total_salary
                    FROM t_p24058207_website_creation_pro.work_shifts ws
                    LEFT JOIN LATERAL (
                        SELECT COUNT(*) as contacts_count
                        FROM t_p24058207_website_creation_pro.leads_analytics la
                        WHERE la.user_id = ws.user_id
                        AND la.created_at::date = ws.shift_date
                        AND la.organization_id = ws.organization_id
                        AND la.lead_type = 'контакт'
                        AND la.is_active = true
                    ) shift_contacts ON true
                    GROUP BY ws.user_id
                )
                SELECT 
                    u.id, u.name, u.email,
                    (
                        (SELECT COALESCE(SUM(approaches), 0) FROM t_p24058207_website_creation_pro.leads WHERE user_id = u.id) +
                        (SELECT COUNT(*) FROM t_p24058207_website_creation_pro.leads_analytics la WHERE la.user_id = u.id AND la.lead_type = 'контакт' AND la.is_active = true)
                    ) as approaches,
                    (SELECT COUNT(*) FROM t_p24058207_website_creation_pro.leads_analytics la
                     WHERE la.user_id = u.id AND la.is_active = true) as total_leads,
                    COALESCE(us.total_salary, 0) as revenue,
                    u.is_active
                FROM t_p24058207_website_creation_pro.users u
                LEFT JOIN user_salary us ON u.id = us.user_id
            """)
            
            user_stats = []
            for row in cur.fetchall():
                user_id = row[0]
                
                if user_id not in user_data_map:
                    continue
                
                user_data = user_data_map[user_id]
                shifts_count = len(user_data['shifts'])
                contacts_count = user_data['contacts']
                
                # Показываем пользователей, у которых есть хотя бы одна смена
                if shifts_count == 0:
                    continue
                
                approaches_count = int(row[3]) if row[3] else 0
                lead_count = int(row[4]) if row[4] else 0
                revenue = int(row[5]) if row[5] else 0
                is_active = bool(row[6])
                
                avg_per_shift = round(lead_count / shifts_count) if shifts_count > 0 else 0
                
                user_stats.append({
                    'user_id': user_id,
                    'name': row[1],
                    'email': row[2], 
                    'lead_count': lead_count,
                    'contacts': contacts_count,
                    'approaches': approaches_count,
                    'shifts_count': shifts_count,
                    'avg_per_shift': avg_per_shift,
                    'max_contacts_per_shift': user_data['max_contacts'],
                    'revenue': revenue,
                    'is_active': is_active
                })
            
            user_stats.sort(key=lambda x: x['contacts'], reverse=True)
            
            # Статистика по дням - загружаем все лиды и группируем по московской дате
            cur.execute("""
                SELECT created_at, lead_type
                FROM t_p24058207_website_creation_pro.leads_analytics
                WHERE created_at >= '2025-01-01' AND is_active = true
                ORDER BY created_at DESC
            """)
            
            # Группируем по московской дате
            daily_groups = {}
            for row in cur.fetchall():
                moscow_dt = get_moscow_time_from_utc(row[0])
                date_key = moscow_dt.date().isoformat()
                
                if date_key not in daily_groups:
                    daily_groups[date_key] = {'contacts': 0, 'approaches': 0, 'total': 0}
                
                daily_groups[date_key]['total'] += 1
                if row[1] == 'контакт':
                    daily_groups[date_key]['contacts'] += 1
            
            # Добавляем подходы из таблицы leads (нажатия кнопки Отменить)
            cur.execute("""
                SELECT created_at, approaches
                FROM t_p24058207_website_creation_pro.leads
                WHERE created_at >= '2025-01-01' AND approaches > 0
                ORDER BY created_at DESC
            """)
            
            for row in cur.fetchall():
                moscow_dt = get_moscow_time_from_utc(row[0])
                date_key = moscow_dt.date().isoformat()
                
                if date_key not in daily_groups:
                    daily_groups[date_key] = {'contacts': 0, 'approaches': 0, 'total': 0}
                
                daily_groups[date_key]['approaches'] += row[1]
            
            # Преобразуем в список и сортируем
            daily_stats = []
            for date_key, stats in daily_groups.items():
                daily_stats.append({
                    'date': date_key,
                    'contacts': stats['contacts'],
                    'approaches': stats['approaches'] + stats['contacts'],  # подходы = отмены + контакты
                    'count': stats['total']
                })
            
            daily_stats.sort(key=lambda x: x['date'], reverse=True)
    
    return {
        'total_leads': total_leads,
        'contacts': contacts,
        'approaches': approaches,
        'user_stats': user_stats,
        'daily_stats': daily_stats
    }

def get_daily_user_stats(date: str) -> List[Dict[str, Any]]:
    """Получить статистику пользователей за конкретный день (московская дата) с группировкой по организациям"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Получаем все лиды с организациями и фильтруем по московской дате на Python стороне
            cur.execute("""
                SELECT u.id, u.name, u.email, l.created_at, l.lead_type, l.organization_id, o.name as org_name
                FROM t_p24058207_website_creation_pro.users u 
                LEFT JOIN t_p24058207_website_creation_pro.leads_analytics l ON u.id = l.user_id 
                LEFT JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
                WHERE l.created_at IS NOT NULL AND l.is_active = true
            """)
            
            # Группируем по пользователям и организациям для заданной московской даты
            user_groups = {}
            for row in cur.fetchall():
                moscow_dt = get_moscow_time_from_utc(row[3])
                date_key = moscow_dt.date().isoformat()
                
                if date_key != date:
                    continue
                
                user_id = row[0]
                org_id = row[5]
                org_name = row[6] if row[6] else 'Не указана'
                lead_type = row[4]
                
                if user_id not in user_groups:
                    user_groups[user_id] = {
                        'name': row[1],
                        'email': row[2],
                        'lead_count': 0,
                        'contacts': 0,
                        'approaches': 0,
                        'organizations': {}
                    }
                
                user_groups[user_id]['lead_count'] += 1
                if lead_type == 'контакт':
                    user_groups[user_id]['contacts'] += 1
                elif lead_type == 'подход':
                    user_groups[user_id]['approaches'] += 1
                
                # Группируем по организациям
                if org_name not in user_groups[user_id]['organizations']:
                    user_groups[user_id]['organizations'][org_name] = {
                        'contacts': 0,
                        'approaches': 0,
                        'total': 0
                    }
                
                user_groups[user_id]['organizations'][org_name]['total'] += 1
                if lead_type == 'контакт':
                    user_groups[user_id]['organizations'][org_name]['contacts'] += 1
                elif lead_type == 'подход':
                    user_groups[user_id]['organizations'][org_name]['approaches'] += 1
            
            # Добавляем подходы из таблицы leads (нажатия кнопки Отменить)
            cur.execute("""
                SELECT u.id, u.name, u.email, l.created_at, l.approaches, l.organization_id, o.name as org_name
                FROM t_p24058207_website_creation_pro.users u 
                LEFT JOIN t_p24058207_website_creation_pro.leads l ON u.id = l.user_id 
                LEFT JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
                WHERE l.created_at IS NOT NULL AND l.approaches > 0
            """)
            
            for row in cur.fetchall():
                moscow_dt = get_moscow_time_from_utc(row[3])
                date_key = moscow_dt.date().isoformat()
                
                if date_key != date:
                    continue
                
                user_id = row[0]
                org_name = row[6] if row[6] else 'Не указана'
                approaches_count = row[4]
                
                if user_id not in user_groups:
                    user_groups[user_id] = {
                        'name': row[1],
                        'email': row[2],
                        'lead_count': 0,
                        'contacts': 0,
                        'approaches': 0,
                        'organizations': {}
                    }
                
                user_groups[user_id]['approaches'] += approaches_count
                
                # Группируем по организациям
                if org_name not in user_groups[user_id]['organizations']:
                    user_groups[user_id]['organizations'][org_name] = {
                        'contacts': 0,
                        'approaches': 0,
                        'total': 0
                    }
                
                user_groups[user_id]['organizations'][org_name]['approaches'] += approaches_count
            
            # Преобразуем в список и сортируем
            user_stats = []
            for user_data in user_groups.values():
                # Преобразуем словарь организаций в список
                org_list = [
                    {
                        'name': org_name,
                        'contacts': stats['contacts'],
                        'approaches': stats['approaches'] + stats['contacts'],  # подходы = отмены + контакты
                        'total': stats['total']
                    }
                    for org_name, stats in user_data['organizations'].items()
                ]
                # Сортируем организации по количеству контактов
                org_list.sort(key=lambda x: x['total'], reverse=True)
                
                user_stats.append({
                    'name': user_data['name'],
                    'email': user_data['email'],
                    'lead_count': user_data['lead_count'],
                    'contacts': user_data['contacts'],
                    'approaches': user_data['approaches'] + user_data['contacts'],  # подходы = отмены + контакты
                    'organizations': org_list
                })
            
            # Сортируем пользователей по количеству лидов
            user_stats.sort(key=lambda x: x['lead_count'], reverse=True)
            return user_stats

def get_daily_detailed_leads(date: str) -> List[Dict[str, Any]]:
    """Получить детальную информацию по лидам за день (московская дата)"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.name, l.lead_type, o.name as organization_name, l.created_at
                FROM t_p24058207_website_creation_pro.leads_analytics l
                JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
                LEFT JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
                WHERE l.is_active = true
                ORDER BY l.created_at DESC
            """)
            
            leads = []
            for row in cur.fetchall():
                if row[3]:
                    try:
                        moscow_dt = get_moscow_time_from_utc(row[3])
                        date_key = moscow_dt.date().isoformat()
                        
                        # Фильтруем по московской дате
                        if date_key != date:
                            continue
                        
                        leads.append({
                            'user_name': row[0],
                            'lead_type': row[1],
                            'organization': row[2] if row[2] else 'Не указана',
                            'created_at': moscow_dt.isoformat()
                        })
                    except Exception:
                        pass
            
            return leads

def get_chart_data() -> List[Dict[str, Any]]:
    """Получить детальные данные для графика по дням и пользователям (московские даты) с организациями"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT l.created_at, u.name, l.lead_type, l.organization_id
                FROM t_p24058207_website_creation_pro.leads_analytics l
                JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
                WHERE l.created_at >= %s AND l.is_active = true
                ORDER BY l.created_at DESC
            """, (get_moscow_time() - timedelta(days=365),))
            
            # Группируем по московской дате и пользователю
            groups = {}
            for row in cur.fetchall():
                moscow_dt = get_moscow_time_from_utc(row[0])
                date_key = moscow_dt.date().isoformat()
                user_name = row[1]
                lead_type = row[2]
                org_id = row[3]
                
                key = (date_key, user_name)
                if key not in groups:
                    groups[key] = {'total_leads': 0, 'contacts': 0, 'approaches': 0, 'organizations': set()}
                
                groups[key]['total_leads'] += 1
                if lead_type == 'контакт':
                    groups[key]['contacts'] += 1
                elif lead_type == 'подход':
                    groups[key]['approaches'] += 1
                
                if org_id:
                    groups[key]['organizations'].add(org_id)
            
            # Преобразуем в список
            chart_data = []
            for (date_key, user_name), stats in groups.items():
                chart_data.append({
                    'date': date_key,
                    'user_name': user_name,
                    'total_leads': stats['total_leads'],
                    'contacts': stats['contacts'],
                    'approaches': stats['approaches'],
                    'organization_ids': list(stats['organizations'])
                })
            
            # Сортируем по дате и имени
            chart_data.sort(key=lambda x: (x['date'], x['user_name']), reverse=True)
            return chart_data

def get_organization_stats() -> List[Dict[str, Any]]:
    """Получить статистику по организациям с группировкой по пользователям и датам"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Получаем данные по контактам для каждого пользователя в каждой организации по датам
            cur.execute("""
                SELECT 
                    l.created_at,
                    u.name as user_name,
                    o.name as organization_name,
                    o.id as organization_id,
                    l.lead_type,
                    o.contact_rate,
                    o.payment_type
                FROM t_p24058207_website_creation_pro.leads_analytics l
                JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
                LEFT JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
                WHERE l.created_at >= %s AND l.lead_type = 'контакт' AND l.is_active = true AND (o.is_active = true OR o.id IS NULL)
                ORDER BY l.created_at DESC
            """, (get_moscow_time() - timedelta(days=365),))
            
            # Группируем по дате, пользователю и организации
            groups = {}
            org_info = {}
            
            for row in cur.fetchall():
                moscow_dt = get_moscow_time_from_utc(row[0])
                date_key = moscow_dt.date().isoformat()
                user_name = row[1]
                org_name = row[2] if row[2] else 'Не указана'
                org_id = row[3] if row[3] else 0
                contact_rate = row[5] if row[5] else 0
                payment_type = row[6] if row[6] else 'cash'
                
                # Сохраняем информацию об организации
                if org_id not in org_info:
                    org_info[org_id] = {
                        'contact_rate': contact_rate,
                        'payment_type': payment_type
                    }
                
                # Группируем по дате и организации для общей статистики
                org_key = (date_key, org_name, org_id)
                if org_key not in groups:
                    groups[org_key] = {
                        'total_contacts': 0,
                        'users': {}
                    }
                
                groups[org_key]['total_contacts'] += 1
                
                # Группируем по пользователям внутри организации
                if user_name not in groups[org_key]['users']:
                    groups[org_key]['users'][user_name] = 0
                groups[org_key]['users'][user_name] += 1
            
            # Преобразуем в список
            org_stats = []
            for (date_key, org_name, org_id), stats in groups.items():
                # Создаем запись для каждой организации по каждой дате
                user_stats_list = [
                    {'user_name': name, 'contacts': count}
                    for name, count in stats['users'].items()
                ]
                
                org_data = org_info.get(org_id, {'contact_rate': 0, 'payment_type': 'cash'})
                
                org_stats.append({
                    'date': date_key,
                    'organization_name': org_name,
                    'organization_id': org_id,
                    'total_contacts': stats['total_contacts'],
                    'contact_rate': org_data['contact_rate'],
                    'payment_type': org_data['payment_type'],
                    'user_stats': user_stats_list
                })
            
            # Сортируем по дате
            org_stats.sort(key=lambda x: x['date'], reverse=True)
            return org_stats

def get_user_leads(user_id: int) -> List[Dict[str, Any]]:
    """Получить метрики лидов пользователя (без текста/аудио - они в Telegram!)"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT l.id, l.user_id, l.lead_type, l.lead_result, l.created_at, 
                       l.telegram_message_id, o.name as organization_name
                FROM t_p24058207_website_creation_pro.leads_analytics l
                LEFT JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
                WHERE l.user_id = %s 
                ORDER BY l.created_at DESC
            """, (user_id,))
            
            leads = []
            for row in cur.fetchall():
                created_at = None
                if row[4]:
                    try:
                        created_at = get_moscow_time_from_utc(row[4]).isoformat()
                    except Exception:
                        created_at = row[4].isoformat() if hasattr(row[4], 'isoformat') else str(row[4])
                
                type_emoji = {
                    'контакт': '📞',
                    'подход': '👋',
                    'продажа': '💰',
                    'отказ': '❌'
                }.get(row[2], '📝')
                
                result_emoji = {
                    'положительный': '✅',
                    'positive': '✅',
                    'нейтральный': '⚪',
                    'neutral': '⚪',
                    'отрицательный': '❌',
                    'negative': '❌'
                }.get(row[3], '⚪')
                
                leads.append({
                    'id': row[0],
                    'user_id': row[1],
                    'notes': f"{type_emoji} {row[2]} {result_emoji} {row[3]}",  # Для совместимости с UI
                    'has_audio': False,  # Больше нет
                    'audio_data': None,
                    'lead_type': row[2],
                    'lead_result': row[3],
                    'telegram_message_id': row[5],
                    'organization_name': row[6],
                    'created_at': created_at
                })
            return leads

def get_user_approaches(user_id: int) -> List[Dict[str, Any]]:
    """Получить подходы пользователя: кнопки 'Отменить' из leads + контакты из leads_analytics (контакт = тоже подход)"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # 1. Подходы из таблицы leads (нажатия кнопки - approaches > 0)
            cur.execute("""
                SELECT l.id, l.created_at, o.name as organization_name, 'подход' as lead_type
                FROM t_p24058207_website_creation_pro.leads l
                LEFT JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
                WHERE l.user_id = %s AND l.approaches > 0
            """, (user_id,))
            rows_approaches = cur.fetchall()

            # 2. Контакты из leads_analytics (контакт тоже является подходом)
            cur.execute("""
                SELECT la.id, la.created_at, o.name as organization_name, 'контакт' as lead_type
                FROM t_p24058207_website_creation_pro.leads_analytics la
                LEFT JOIN t_p24058207_website_creation_pro.organizations o ON la.organization_id = o.id
                WHERE la.user_id = %s AND la.lead_type = 'контакт'
            """, (user_id,))
            rows_contacts = cur.fetchall()

            all_rows = list(rows_approaches) + list(rows_contacts)
            approaches = []
            for row in all_rows:
                created_at = None
                if row[1]:
                    try:
                        created_at = get_moscow_time_from_utc(row[1]).isoformat()
                    except Exception:
                        created_at = row[1].isoformat() if hasattr(row[1], 'isoformat') else str(row[1])

                approaches.append({
                    'id': row[0],
                    'created_at': created_at,
                    'lead_type': row[3],
                    'organization_name': row[2],
                })

            # Сортируем по дате DESC
            approaches.sort(key=lambda x: x['created_at'] or '', reverse=True)
            return approaches

def get_user_work_time(user_id: int) -> List[Dict[str, Any]]:
    """Получить данные о времени работы промоутера за каждый день на основе видео открытия/закрытия смены"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT 
                    work_date,
                    MIN(CASE WHEN video_type = 'start' THEN created_at END) as shift_start,
                    MAX(CASE WHEN video_type = 'end' THEN created_at END) as shift_end,
                    organization_id
                FROM t_p24058207_website_creation_pro.shift_videos
                WHERE user_id = %s
                GROUP BY work_date, organization_id
                ORDER BY work_date DESC
            """, (user_id,))
            
            work_time_data = []
            for row in cur.fetchall():
                work_date = row[0]
                shift_start = row[1]
                shift_end = row[2]
                organization_id = row[3]
                
                # Обрабатываем смены даже если нет начала или конца
                if shift_start:
                    shift_start_moscow = get_moscow_time_from_utc(shift_start)
                    start_time_str = shift_start_moscow.strftime('%H:%M')
                else:
                    start_time_str = '—'
                
                if shift_end:
                    shift_end_moscow = get_moscow_time_from_utc(shift_end)
                    end_time_str = shift_end_moscow.strftime('%H:%M')
                    
                    if shift_start:
                        time_diff = shift_end_moscow - shift_start_moscow
                        hours = int(time_diff.total_seconds() // 3600)
                        minutes = int((time_diff.total_seconds() % 3600) // 60)
                        hours_worked = f'{hours}ч {minutes}м'
                    else:
                        hours_worked = 'Только закрытие'
                else:
                    end_time_str = '—'
                    hours_worked = 'Смена не закрыта' if shift_start else 'Нет данных'
                
                cur.execute(
                    "SELECT COUNT(*) FROM t_p24058207_website_creation_pro.leads_analytics WHERE user_id = %s AND DATE(created_at) = %s AND organization_id = %s",
                    (user_id, work_date, organization_id)
                )
                leads_count_result = cur.fetchone()
                leads_count = leads_count_result[0] if leads_count_result else 0
                
                work_time_data.append({
                    'date': work_date.strftime('%d.%m.%Y') if hasattr(work_date, 'strftime') else str(work_date),
                    'start_time': start_time_str,
                    'end_time': end_time_str,
                    'hours_worked': hours_worked,
                    'leads_count': leads_count
                })
            
            return work_time_data

def get_all_users_work_time() -> List[Dict[str, Any]]:
    """Получить данные о времени работы всех промоутеров"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Получаем смены из двух источников: shift_videos И work_shifts
            # Приоритет shift_videos - если есть смена с видео, ручная не показывается
            cur.execute("""
                SELECT DISTINCT ON (user_id, work_date, organization_id)
                    user_id,
                    user_name,
                    work_date,
                    shift_start,
                    shift_end,
                    organization_id
                FROM (
                    -- Смены из shift_videos (с видео) - приоритет 1
                    SELECT 
                        sv.user_id,
                        u.name as user_name,
                        sv.work_date,
                        MIN(CASE WHEN sv.video_type = 'start' THEN sv.created_at END) as shift_start,
                        MAX(CASE WHEN sv.video_type = 'end' THEN sv.created_at END) as shift_end,
                        sv.organization_id,
                        1 as priority
                    FROM t_p24058207_website_creation_pro.shift_videos sv
                    JOIN t_p24058207_website_creation_pro.users u ON sv.user_id = u.id
                    GROUP BY sv.user_id, u.name, sv.work_date, sv.organization_id
                    
                    UNION ALL
                    
                    -- Ручные смены из work_shifts - приоритет 2
                    SELECT 
                        ws.user_id,
                        u.name as user_name,
                        ws.shift_date as work_date,
                        ws.shift_start,
                        ws.shift_end,
                        ws.organization_id,
                        2 as priority
                    FROM t_p24058207_website_creation_pro.work_shifts ws
                    JOIN t_p24058207_website_creation_pro.users u ON ws.user_id = u.id
                    WHERE ws.shift_start IS NOT NULL AND ws.shift_end IS NOT NULL
                ) combined_shifts
                ORDER BY user_id, work_date, organization_id, priority, work_date DESC, user_name
            """)
            
            shifts_rows = cur.fetchall()
            
            # Затем получаем ВСЕ лиды одним запросом и группируем в памяти
            cur.execute("""
                SELECT user_id, DATE(created_at) as lead_date, organization_id, COUNT(*) as count
                FROM t_p24058207_website_creation_pro.leads_analytics
                WHERE is_active = true
                GROUP BY user_id, DATE(created_at), organization_id
            """)
            
            # Создаем словарь для быстрого поиска количества лидов
            leads_map = {}
            for lead_row in cur.fetchall():
                key = (lead_row[0], lead_row[1], lead_row[2])  # (user_id, date, org_id)
                leads_map[key] = lead_row[3]
            
            work_time_data = []
            for row in shifts_rows:
                user_id = row[0]
                user_name = row[1]
                work_date = row[2]
                shift_start = row[3]
                shift_end = row[4]
                organization_id = row[5]
                
                # Обрабатываем смены даже если нет начала или конца
                if shift_start:
                    if shift_start.tzinfo is None:
                        shift_start = shift_start.replace(tzinfo=pytz.UTC)
                    shift_start_moscow = shift_start.astimezone(MOSCOW_TZ)
                    start_time_str = shift_start_moscow.strftime('%H:%M')
                else:
                    start_time_str = '—'
                
                if shift_end:
                    if shift_end.tzinfo is None:
                        shift_end = shift_end.replace(tzinfo=pytz.UTC)
                    shift_end_moscow = shift_end.astimezone(MOSCOW_TZ)
                    end_time_str = shift_end_moscow.strftime('%H:%M')
                    
                    if shift_start:
                        time_diff = shift_end_moscow - shift_start_moscow
                        hours = int(time_diff.total_seconds() // 3600)
                        minutes = int((time_diff.total_seconds() % 3600) // 60)
                        hours_worked = f'{hours}ч {minutes}м'
                    else:
                        hours_worked = 'Только закрытие'
                else:
                    end_time_str = '—'
                    hours_worked = 'Смена не закрыта' if shift_start else 'Нет данных'
                
                # Получаем количество лидов из предзагруженных данных
                leads_count = leads_map.get((user_id, work_date, organization_id), 0)
                
                date_str = work_date.strftime('%d.%m.%Y') if hasattr(work_date, 'strftime') else str(work_date)
                
                work_time_data.append({
                    'user_id': user_id,
                    'user_name': user_name,
                    'date': date_str,
                    'start_time': start_time_str,
                    'end_time': end_time_str,
                    'hours_worked': hours_worked,
                    'leads_count': leads_count
                })
            
            return work_time_data

def update_user_name(user_id: int, new_name: str) -> bool:
    """Обновить имя пользователя"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE t_p24058207_website_creation_pro.users SET name = %s WHERE id = %s",
                (new_name, user_id)
            )
            conn.commit()
            return cur.rowcount > 0

def delete_user(user_id: int) -> bool:
    """Деактивировать пользователя (is_active=false), сохранив все данные, и заблокировать IP"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT registration_ip FROM t_p24058207_website_creation_pro.users WHERE id = %s", (user_id,))
            row = cur.fetchone()
            user_ip = row[0] if row else None
            
            if user_ip and user_ip != 'unknown':
                cur.execute(
                    "INSERT INTO t_p24058207_website_creation_pro.blocked_ips (ip_address, blocked_reason) VALUES (%s, %s) ON CONFLICT (ip_address) DO NOTHING",
                    (user_ip, f'User ID {user_id} deactivated by admin')
                )
            
            cur.execute("DELETE FROM t_p24058207_website_creation_pro.user_sessions WHERE user_id = %s", (user_id,))
            
            cur.execute(
                "UPDATE t_p24058207_website_creation_pro.users SET is_active = FALSE WHERE id = %s AND is_admin = FALSE",
                (user_id,)
            )
            
            conn.commit()
            return cur.rowcount > 0

def activate_user(user_id: int) -> bool:
    """Активировать пользователя (is_active=true) и разблокировать IP"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT registration_ip FROM t_p24058207_website_creation_pro.users WHERE id = %s", (user_id,))
            row = cur.fetchone()
            user_ip = row[0] if row else None
            
            if user_ip and user_ip != 'unknown':
                cur.execute(
                    "DELETE FROM t_p24058207_website_creation_pro.blocked_ips WHERE ip_address = %s",
                    (user_ip,)
                )
            
            cur.execute(
                "UPDATE t_p24058207_website_creation_pro.users SET is_active = TRUE WHERE id = %s AND is_admin = FALSE",
                (user_id,)
            )
            
            conn.commit()
            return cur.rowcount > 0

def delete_lead(lead_id: int) -> bool:
    """Удалить метрику лида (полный лид остаётся в Telegram!)"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM t_p24058207_website_creation_pro.leads_analytics WHERE id = %s", (lead_id,))
            conn.commit()
            return cur.rowcount > 0

def delete_leads_by_date(user_id: int, date_str: str) -> int:
    """Удалить все лиды пользователя за конкретный день (московская дата). Возвращает количество удалённых лидов."""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, created_at 
                FROM t_p24058207_website_creation_pro.leads_analytics 
                WHERE user_id = %s
            """, (user_id,))
            
            lead_ids_to_delete = []
            for row in cur.fetchall():
                moscow_dt = get_moscow_time_from_utc(row[1])
                date_key = moscow_dt.date().isoformat()
                
                if date_key == date_str:
                    lead_ids_to_delete.append(row[0])
            
            if lead_ids_to_delete:
                placeholders = ','.join(['%s'] * len(lead_ids_to_delete))
                cur.execute(f"""
                    DELETE FROM t_p24058207_website_creation_pro.leads_analytics 
                    WHERE id IN ({placeholders})
                """, lead_ids_to_delete)
                conn.commit()
                return cur.rowcount
            
            return 0

def add_manual_shift(user_id: int, work_date: str, start_time: str, end_time: str) -> bool:
    """Добавить смену вручную для промоутера"""
    try:
        start_datetime = datetime.strptime(f"{work_date} {start_time}", "%Y-%m-%d %H:%M")
        end_datetime = datetime.strptime(f"{work_date} {end_time}", "%Y-%m-%d %H:%M")
        
        moscow_tz = pytz.timezone('Europe/Moscow')
        start_moscow = moscow_tz.localize(start_datetime)
        end_moscow = moscow_tz.localize(end_datetime)
        
        start_utc = start_moscow.astimezone(pytz.UTC)
        end_utc = end_moscow.astimezone(pytz.UTC)
        
        organization_id = 1
        
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO t_p24058207_website_creation_pro.work_shifts 
                    (user_id, organization_id, shift_date, shift_start, shift_end)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (user_id, organization_id, shift_date) 
                    DO UPDATE SET 
                        shift_start = EXCLUDED.shift_start,
                        shift_end = EXCLUDED.shift_end
                """, (user_id, organization_id, work_date, start_utc, end_utc))
                
                cur.execute("""
                    INSERT INTO t_p24058207_website_creation_pro.shift_videos 
                    (user_id, work_date, video_type, created_at, organization_id)
                    VALUES 
                    (%s, %s, 'start', %s, %s),
                    (%s, %s, 'end', %s, %s)
                    ON CONFLICT (user_id, work_date, video_type, organization_id) 
                    DO UPDATE SET created_at = EXCLUDED.created_at
                """, (user_id, work_date, start_utc, organization_id, 
                      user_id, work_date, end_utc, organization_id))
                
                conn.commit()
                return True
    except Exception as e:
        print(f"Error adding manual shift: {e}")
        return False

def delete_shift_by_date(user_id: int, work_date: str) -> bool:
    """Удалить информацию о смене (открытие/закрытие) для конкретного дня и пользователя из обеих таблиц"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            deleted_count = 0
            
            cur.execute("""
                DELETE FROM t_p24058207_website_creation_pro.shift_videos 
                WHERE user_id = %s AND work_date = %s
            """, (user_id, work_date))
            deleted_count += cur.rowcount
            
            cur.execute("""
                DELETE FROM t_p24058207_website_creation_pro.work_shifts 
                WHERE user_id = %s AND shift_date = %s
            """, (user_id, work_date))
            deleted_count += cur.rowcount
            
            conn.commit()
            return deleted_count > 0

def get_pending_users() -> List[Dict[str, Any]]:
    """Получить список пользователей, ожидающих одобрения"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id, email, name, registration_ip, created_at
                FROM t_p24058207_website_creation_pro.users
                WHERE is_approved = FALSE AND is_admin = FALSE
                ORDER BY created_at DESC
            """)
            
            pending_users = []
            for row in cur.fetchall():
                created_at = None
                if row[4]:
                    try:
                        created_at = get_moscow_time_from_utc(row[4]).isoformat()
                    except Exception:
                        created_at = row[4].isoformat() if hasattr(row[4], 'isoformat') else str(row[4])
                
                pending_users.append({
                    'id': row[0],
                    'email': row[1],
                    'name': row[2],
                    'registration_ip': row[3],
                    'created_at': created_at
                })
            return pending_users

def get_user_revenue_details(email: str) -> List[Dict[str, Any]]:
    """Получить детализацию зарплаты пользователя по организациям (смены из бухучёта)"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id FROM t_p24058207_website_creation_pro.users 
                WHERE email = %s
            """, (email,))
            user_row = cur.fetchone()
            
            if not user_row:
                return []
            
            user_id = user_row[0]
            
            # Получаем зарплату по сменам из бухучёта (work_shifts)
            cur.execute("""
                SELECT 
                    o.name as organization_name,
                    ws.shift_date,
                    ws.organization_id,
                    COALESCE(shift_contacts.contacts_count, 0) as contacts
                FROM t_p24058207_website_creation_pro.work_shifts ws
                LEFT JOIN t_p24058207_website_creation_pro.organizations o ON ws.organization_id = o.id
                LEFT JOIN LATERAL (
                    SELECT COUNT(*) as contacts_count
                    FROM t_p24058207_website_creation_pro.leads_analytics la
                    WHERE la.user_id = ws.user_id
                    AND la.created_at::date = ws.shift_date
                    AND la.organization_id = ws.organization_id
                    AND la.lead_type = 'контакт'
                    AND la.is_active = true
                ) shift_contacts ON true
                WHERE ws.user_id = %s
                ORDER BY o.name, ws.shift_date DESC
            """, (user_id,))
            
            # Группируем по организациям
            org_salary_map = {}
            for row in cur.fetchall():
                org_name = row[0] if row[0] else 'Не указана'
                contacts = row[3]
                
                if org_name not in org_salary_map:
                    org_salary_map[org_name] = {
                        'total_contacts': 0,
                        'total_salary': 0,
                        'shifts': 0
                    }
                
                # Зарплата за смену: ≥10 контактов → 300₽, <10 → 200₽
                shift_salary = contacts * 300 if contacts >= 10 else contacts * 200
                
                org_salary_map[org_name]['total_contacts'] += contacts
                org_salary_map[org_name]['total_salary'] += shift_salary
                org_salary_map[org_name]['shifts'] += 1
            
            # Формируем итоговый список
            org_revenues = []
            for org_name, data in org_salary_map.items():
                avg_rate = round(data['total_salary'] / data['total_contacts']) if data['total_contacts'] > 0 else 0
                
                org_revenues.append({
                    'organization_name': org_name,
                    'contacts': data['total_contacts'],
                    'shifts': data['shifts'],
                    'rate': avg_rate,
                    'payment_type': 'salary',  # Тип "зарплата"
                    'revenue_before_tax': data['total_salary'],
                    'tax': 0,
                    'revenue_after_tax': data['total_salary']
                })
            
            # Сортируем по зарплате (убыв.)
            org_revenues.sort(key=lambda x: x['revenue_after_tax'], reverse=True)
            
            return org_revenues

def get_batch_user_org_stats(emails: List[str]) -> Dict[str, List[Dict[str, Any]]]:
    """Получить статистику по организациям для нескольких пользователей одним запросом"""
    if not emails:
        return {}
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Получаем ID пользователей по email
            placeholders = ','.join(['%s'] * len(emails))
            cur.execute(f"""
                SELECT id, email FROM t_p24058207_website_creation_pro.users 
                WHERE email IN ({placeholders})
            """, tuple(emails))
            
            email_to_id = {row[1]: row[0] for row in cur.fetchall()}
            
            if not email_to_id:
                return {}
            
            user_ids = list(email_to_id.values())
            placeholders = ','.join(['%s'] * len(user_ids))
            
            # Получаем все лиды для этих пользователей за один запрос
            cur.execute(f"""
                SELECT 
                    l.user_id,
                    o.id as org_id,
                    o.name as organization_name,
                    l.created_at,
                    l.lead_type
                FROM t_p24058207_website_creation_pro.leads_analytics l
                JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
                WHERE l.user_id IN ({placeholders}) AND l.is_active = true
            """, tuple(user_ids))
            
            # Группируем по пользователям
            user_org_data = {}
            for row in cur.fetchall():
                user_id = row[0]
                org_id = row[1]
                org_name = row[2]
                created_at = row[3]
                lead_type = row[4]
                
                moscow_dt = get_moscow_time_from_utc(created_at)
                moscow_date = moscow_dt.date()
                
                if user_id not in user_org_data:
                    user_org_data[user_id] = {}
                
                key = (org_id, org_name)
                if key not in user_org_data[user_id]:
                    user_org_data[user_id][key] = {
                        'shift_dates': set(),
                        'daily_contacts': {}
                    }
                
                # Считаем смены по всем лидам (дата + организация)
                user_org_data[user_id][key]['shift_dates'].add(moscow_date)
                
                # Считаем контакты отдельно
                if lead_type == 'контакт':
                    if moscow_date not in user_org_data[user_id][key]['daily_contacts']:
                        user_org_data[user_id][key]['daily_contacts'][moscow_date] = 0
                    user_org_data[user_id][key]['daily_contacts'][moscow_date] += 1
            
            # Формируем результат по email
            id_to_email = {v: k for k, v in email_to_id.items()}
            result = {}
            
            for user_id, org_data in user_org_data.items():
                email = id_to_email.get(user_id)
                if not email:
                    continue
                
                org_stats = []
                for (org_id, org_name), data in org_data.items():
                    # Берём только последние 3 смены
                    sorted_dates = sorted(data['shift_dates'], reverse=True)[:3]
                    
                    # Считаем контакты только по последним 3 сменам
                    recent_contacts = sum(
                        data['daily_contacts'].get(date, 0) 
                        for date in sorted_dates
                    )
                    shifts = len(sorted_dates)
                    
                    if shifts > 0:
                        avg_per_shift = round(recent_contacts / shifts, 1)
                    else:
                        avg_per_shift = 0.0
                    
                    org_stats.append({
                        'organization_name': org_name,
                        'contacts': recent_contacts,
                        'shifts': shifts,
                        'avg_per_shift': avg_per_shift,
                        'shift_count': shifts
                    })
                
                org_stats.sort(key=lambda x: x['avg_per_shift'], reverse=True)
                result[email] = org_stats
            
            return result

def get_user_org_stats(email: str) -> List[Dict[str, Any]]:
    """Получить статистику пользователя по организациям"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id FROM t_p24058207_website_creation_pro.users 
                WHERE email = %s
            """, (email,))
            user_row = cur.fetchone()
            
            if not user_row:
                return []
            
            user_id = user_row[0]
            
            cur.execute("""
                SELECT 
                    o.id as org_id,
                    o.name as organization_name,
                    l.created_at,
                    l.lead_type
                FROM t_p24058207_website_creation_pro.leads_analytics l
                JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
                WHERE l.user_id = %s AND l.is_active = true
            """, (user_id,))
            
            org_data = {}
            for row in cur.fetchall():
                org_id = row[0]
                org_name = row[1]
                created_at = row[2]
                lead_type = row[3]
                
                moscow_dt = get_moscow_time_from_utc(created_at)
                moscow_date = moscow_dt.date()
                
                key = (org_id, org_name)
                if key not in org_data:
                    org_data[key] = {
                        'shift_dates': set(),
                        'daily_contacts': {}
                    }
                
                # Считаем смены по всем лидам (дата + организация)
                org_data[key]['shift_dates'].add(moscow_date)
                
                # Считаем контакты отдельно
                if lead_type == 'контакт':
                    if moscow_date not in org_data[key]['daily_contacts']:
                        org_data[key]['daily_contacts'][moscow_date] = 0
                    org_data[key]['daily_contacts'][moscow_date] += 1
            
            org_stats = []
            for (org_id, org_name), data in org_data.items():
                # Берём только последние 3 смены
                sorted_dates = sorted(data['shift_dates'], reverse=True)[:3]
                
                # Считаем контакты только по последним 3 сменам
                recent_contacts = sum(
                    data['daily_contacts'].get(date, 0) 
                    for date in sorted_dates
                )
                shifts = len(sorted_dates)
                
                if shifts > 0:
                    avg_per_shift = round(recent_contacts / shifts, 1)
                else:
                    avg_per_shift = 0.0
                
                org_stats.append({
                    'organization_name': org_name,
                    'contacts': recent_contacts,
                    'shifts': shifts,
                    'avg_per_shift': avg_per_shift,
                    'shift_count': shifts
                })
            
            org_stats.sort(key=lambda x: x['avg_per_shift'], reverse=True)
            return org_stats

def get_recent_contacts(email: str, limit: int = 7) -> List[Dict[str, Any]]:
    """Получить последние N смен с контактами пользователя"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id FROM t_p24058207_website_creation_pro.users 
                WHERE email = %s
            """, (email,))
            user_row = cur.fetchone()
            
            if not user_row:
                return []
            
            user_id = user_row[0]
            
            cur.execute("""
                SELECT 
                    DATE(created_at) as shift_date,
                    COUNT(*) as contacts
                FROM t_p24058207_website_creation_pro.leads_analytics
                WHERE user_id = %s 
                    AND lead_type = 'контакт'
                    AND is_active = true
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at) DESC
                LIMIT %s
            """, (user_id, limit))
            
            recent_shifts = []
            for row in cur.fetchall():
                recent_shifts.append({
                    'date': row[0].isoformat(),
                    'contacts': row[1]
                })
            
            # Reverse to show chronological order (oldest first)
            recent_shifts.reverse()
            return recent_shifts

def get_recent_contacts_org(email: str, org_name: str, limit: int = 7) -> List[Dict[str, Any]]:
    """Получить последние N смен с контактами пользователя в конкретной организации"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id FROM t_p24058207_website_creation_pro.users 
                WHERE email = %s
            """, (email,))
            user_row = cur.fetchone()
            
            if not user_row:
                return []
            
            user_id = user_row[0]
            
            # Получаем organization_id по имени
            cur.execute("""
                SELECT id FROM t_p24058207_website_creation_pro.organizations 
                WHERE name = %s
            """, (org_name,))
            org_row = cur.fetchone()
            
            if not org_row:
                return []
            
            org_id = org_row[0]
            
            cur.execute("""
                SELECT 
                    DATE(created_at) as shift_date,
                    COUNT(*) as contacts
                FROM t_p24058207_website_creation_pro.leads_analytics
                WHERE user_id = %s 
                    AND organization_id = %s
                    AND lead_type = 'контакт'
                    AND is_active = true
                GROUP BY DATE(created_at)
                ORDER BY DATE(created_at) DESC
                LIMIT %s
            """, (user_id, org_id, limit))
            
            recent_shifts = []
            for row in cur.fetchall():
                recent_shifts.append({
                    'date': row[0].isoformat(),
                    'contacts': row[1]
                })
            
            # Reverse to show chronological order (oldest first)
            recent_shifts.reverse()
            return recent_shifts

def get_user_shifts(email: str) -> List[Dict[str, Any]]:
    """Получить все смены пользователя с детальной информацией"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id FROM t_p24058207_website_creation_pro.users 
                WHERE email = %s
            """, (email,))
            user_row = cur.fetchone()
            
            if not user_row:
                return []
            
            user_id = user_row[0]
            
            cur.execute("""
                SELECT 
                    l.created_at,
                    l.lead_type,
                    o.id as org_id,
                    o.name as organization_name
                FROM t_p24058207_website_creation_pro.leads_analytics l
                LEFT JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
                WHERE l.user_id = %s AND l.is_active = true
                ORDER BY l.created_at DESC
            """, (user_id,))
            
            shift_data = {}
            for row in cur.fetchall():
                created_at = row[0]
                lead_type = row[1]
                org_id = row[2]
                org_name = row[3] if row[3] else 'Не указана'
                
                moscow_dt = get_moscow_time_from_utc(created_at)
                moscow_date = moscow_dt.date()
                
                key = (moscow_date, org_id, org_name)
                if key not in shift_data:
                    shift_data[key] = {
                        'total_leads': 0,
                        'contacts': 0,
                        'approaches': 0
                    }
                
                shift_data[key]['total_leads'] += 1
                if lead_type == 'контакт':
                    shift_data[key]['contacts'] += 1
                elif lead_type == 'подход':
                    shift_data[key]['approaches'] += 1
            
            shifts = []
            for (date, org_id, org_name), data in shift_data.items():
                shifts.append({
                    'date': date.isoformat(),
                    'organization_id': org_id,
                    'organization_name': org_name,
                    'total_leads': data['total_leads'],
                    'contacts': data['contacts'],
                    'approaches': data['approaches']
                })
            
            shifts.sort(key=lambda x: x['date'], reverse=True)
            return shifts

def get_user_org_shift_details(email: str, org_name: str) -> List[Dict[str, Any]]:
    """Получить детальную информацию по сменам пользователя в конкретной организации"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT id FROM t_p24058207_website_creation_pro.users 
                WHERE email = %s
            """, (email,))
            user_row = cur.fetchone()
            
            if not user_row:
                return []
            
            user_id = user_row[0]
            
            cur.execute("""
                SELECT 
                    l.created_at,
                    l.lead_type
                FROM t_p24058207_website_creation_pro.leads_analytics l
                JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
                WHERE l.user_id = %s AND o.name = %s AND l.is_active = true
                ORDER BY l.created_at
            """, (user_id, org_name))
            
            daily_data = {}
            for row in cur.fetchall():
                created_at = row[0]
                lead_type = row[1]
                
                moscow_dt = get_moscow_time_from_utc(created_at)
                moscow_date = moscow_dt.date()
                
                if moscow_date not in daily_data:
                    daily_data[moscow_date] = 0
                
                if lead_type == 'контакт':
                    daily_data[moscow_date] += 1
            
            shift_details = []
            for date, contacts in sorted(daily_data.items(), reverse=True):
                shift_details.append({
                    'date': date.isoformat(),
                    'contacts': contacts
                })
            
            return shift_details

def delete_year_2025_data() -> Dict[str, int]:
    """Удалить все данные за 2025 год из всех таблиц"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Удаляем лиды за 2025
            cur.execute("""
                DELETE FROM t_p24058207_website_creation_pro.leads_analytics 
                WHERE created_at >= '2025-01-01 00:00:00' AND created_at < '2026-01-01 00:00:00'
            """)
            deleted_leads = cur.rowcount
            
            # Удаляем смены за 2025
            cur.execute("""
                DELETE FROM t_p24058207_website_creation_pro.work_shifts 
                WHERE shift_date >= '2025-01-01' AND shift_date < '2026-01-01'
            """)
            deleted_shifts = cur.rowcount
            
            # Удаляем видео смен за 2025
            cur.execute("""
                DELETE FROM t_p24058207_website_creation_pro.shift_videos 
                WHERE work_date >= '2025-01-01' AND work_date < '2026-01-01'
            """)
            deleted_videos = cur.rowcount
            
            conn.commit()
            
            return {
                'deleted_leads': deleted_leads,
                'deleted_shifts': deleted_shifts,
                'deleted_videos': deleted_videos
            }

def approve_user(user_id: int, admin_id: int) -> bool:
    """Одобрить пользователя"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute(
                "UPDATE t_p24058207_website_creation_pro.users SET is_approved = TRUE, approved_at = %s, approved_by = %s WHERE id = %s AND is_admin = FALSE",
                (get_moscow_time(), admin_id, user_id)
            )
            conn.commit()
            return cur.rowcount > 0

def reject_user(user_id: int) -> bool:
    """Отклонить заявку пользователя (удалить и заблокировать IP)"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT registration_ip FROM t_p24058207_website_creation_pro.users WHERE id = %s", (user_id,))
            row = cur.fetchone()
            
            if not row:
                return False
            
            user_ip = row[0] if row else None
            
            if user_ip and user_ip != 'unknown':
                cur.execute(
                    "INSERT INTO t_p24058207_website_creation_pro.blocked_ips (ip_address, blocked_reason) VALUES (%s, %s) ON CONFLICT (ip_address) DO NOTHING",
                    (user_ip, f'User ID {user_id} rejected by admin')
                )
            
            cur.execute("DELETE FROM t_p24058207_website_creation_pro.user_sessions WHERE user_id = %s", (user_id,))
            cur.execute("DELETE FROM t_p24058207_website_creation_pro.users WHERE id = %s AND is_admin = FALSE", (user_id,))
            
            conn.commit()
            return True

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    print(f'🚀 Handler called: method={method}, url={event.get("url", "N/A")}')
    print(f'🚀 Request path: {event.get("requestContext", {}).get("http", {}).get("path", "N/A")}')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }

    headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    }
    
    try:
        return _handle_request(event, context, method, headers)
    except Exception as e:
        print(f"❌ Error in handler: {e}")
        import traceback
        traceback.print_exc()
        return {
            'statusCode': 500,
            'headers': headers,
            'body': json.dumps({'error': f'Internal server error: {str(e)}'}),
            'isBase64Encoded': False
        }

def _handle_request(event: Dict[str, Any], context: Any, method: str, headers: Dict[str, str]) -> Dict[str, Any]:

    # Заголовки могут быть в разных регистрах
    headers_dict = event.get('headers', {})
    session_token = (
        headers_dict.get('X-Session-Token') or 
        headers_dict.get('x-session-token') or
        headers_dict.get('X-SESSION-TOKEN')
    )
    
    if not session_token:
        return {
            'statusCode': 401,
            'headers': headers,
            'body': json.dumps({'error': 'Требуется авторизация'})
        }

    user = get_user_by_session(session_token)
    
    if not user:
        return {
            'statusCode': 403,
            'headers': headers,
            'body': json.dumps({'error': 'Доступ запрещен'})
        }

    if method == 'GET':
        action = event.get('queryStringParameters', {}).get('action', '')
        
        # get_organizations доступен для всех авторизованных пользователей
        if action == 'get_organizations':
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT o.id, o.name, o.created_at, o.contact_rate, o.payment_type,
                               COUNT(CASE WHEN l.lead_type = 'контакт' THEN 1 END) as lead_count
                        FROM t_p24058207_website_creation_pro.organizations o
                        LEFT JOIN t_p24058207_website_creation_pro.leads_analytics l 
                            ON o.id = l.organization_id 
                            AND l.is_active = true
                        WHERE o.is_active = true
                        GROUP BY o.id, o.name, o.created_at, o.contact_rate, o.payment_type
                        ORDER BY o.name
                    """)
                    organizations = []
                    for row in cur.fetchall():
                        organizations.append({
                            'id': row[0],
                            'name': row[1],
                            'created_at': row[2].isoformat() if row[2] else None,
                            'contact_rate': int(row[3]) if row[3] else 0,
                            'payment_type': row[4] if row[4] else 'cash',
                            'lead_count': int(row[5])
                        })
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'organizations': organizations})
            }
        
        # Остальные действия требуют прав админа
        if not user['is_admin']:
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({'error': 'Доступ запрещен'})
            }
        
        if action == 'users':
            active_users = get_all_users(is_active=True)
            inactive_users = get_all_users(is_active=False)
            # Для бухучёта нужен простой список users
            users = [{'id': u['id'], 'name': u['name']} for u in active_users]
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'users': users,
                    'active_users': active_users,
                    'inactive_users': inactive_users
                })
            }
        
        elif action == 'stats':
            stats = get_leads_stats()
            # Добавляем простую агрегацию для графика (только общее кол-во по датам)
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT DATE(l.created_at) as date,
                               COUNT(CASE WHEN l.lead_type = 'контакт' THEN 1 END) as contacts
                        FROM t_p24058207_website_creation_pro.leads_analytics l
                        JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
                        WHERE l.created_at >= %s
                        GROUP BY DATE(l.created_at)
                        ORDER BY DATE(l.created_at)
                    """, (get_moscow_time() - timedelta(days=30),))
                    
                    simple_daily = []
                    for row in cur.fetchall():
                        simple_daily.append({
                            'date': row[0].isoformat() if row[0] else None,
                            'contacts': row[1]
                        })
                    stats['simple_daily_stats'] = simple_daily
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(stats)
            }
        
        elif action == 'chart_data':
            chart_data = get_chart_data()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'chart_data': chart_data})
            }
        
        elif action == 'organization_stats':
            org_stats = get_organization_stats()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'organization_stats': org_stats})
            }
        
        elif action == 'daily_user_stats':
            date = event.get('queryStringParameters', {}).get('date')
            if not date:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Требуется параметр date'})
                }
            
            try:
                user_stats = get_daily_user_stats(date)
                detailed_leads = get_daily_detailed_leads(date)
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'user_stats': user_stats, 'detailed_leads': detailed_leads})
                }
            except Exception as e:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': f'Ошибка получения статистики: {str(e)}'})
                }
        
        elif action == 'pending_users':
            pending_users = get_pending_users()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'pending_users': pending_users})
            }
        
        elif action == 'user_leads':
            user_id = event.get('queryStringParameters', {}).get('user_id')
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Требуется user_id'})
                }
            
            try:
                user_id = int(user_id)
                leads = get_user_leads(user_id)
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'leads': leads})
                }
            except ValueError:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Неверный формат user_id'})
                }
        
        elif action == 'user_approaches':
            user_id = event.get('queryStringParameters', {}).get('user_id')
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Требуется user_id'})
                }
            try:
                user_id = int(user_id)
                approaches = get_user_approaches(user_id)
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'approaches': approaches})
                }
            except ValueError:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Неверный формат user_id'})
                }

        elif action == 'delete_approach':
            approach_id = body_data.get('approach_id')
            if not approach_id:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'approach_id required'})}
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM t_p24058207_website_creation_pro.leads WHERE id = %s", (int(approach_id),))
                    conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}

        elif action == 'delete_approach_lead':
            lead_id = body_data.get('lead_id')
            if not lead_id:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'lead_id required'})}
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM t_p24058207_website_creation_pro.leads_analytics WHERE id = %s", (int(lead_id),))
                    conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}

        elif action == 'delete_approaches_by_date':
            user_id_del = body_data.get('user_id')
            date = body_data.get('date')
            if not user_id_del or not date:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'user_id and date required'})}
            try:
                day, month, year = date.split('.')
                date_iso = f"{year}-{month}-{day}"
                msk_start = datetime.strptime(date_iso, '%Y-%m-%d')
                msk_end = msk_start + timedelta(days=1)
                utc_start = msk_start - timedelta(hours=3)
                utc_end = msk_end - timedelta(hours=3)
            except Exception:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Invalid date format'})}
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        DELETE FROM t_p24058207_website_creation_pro.leads
                        WHERE user_id = %s AND approaches > 0
                        AND created_at >= %s AND created_at < %s
                    """, (int(user_id_del), utc_start, utc_end))
                    cur.execute("""
                        DELETE FROM t_p24058207_website_creation_pro.leads_analytics
                        WHERE user_id = %s AND lead_type = 'контакт'
                        AND created_at >= %s AND created_at < %s
                    """, (int(user_id_del), utc_start, utc_end))
                    conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}

        elif action == 'user_work_time':
            user_id = event.get('queryStringParameters', {}).get('user_id')
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Требуется user_id'})
                }
            
            try:
                user_id = int(user_id)
                work_time = get_user_work_time(user_id)
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'work_time': work_time})
                }
            except ValueError:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Неверный user_id'})
                }
        
        elif action == 'all_users_work_time':
            work_time = get_all_users_work_time()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'work_time': work_time})
            }
        
        elif action == 'get_rate_periods':
            organization_id = event.get('queryStringParameters', {}).get('organization_id')
            
            if not organization_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'ID организации обязателен'})
                }
            
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT id, start_date, end_date, contact_rate, payment_type, created_at
                        FROM t_p24058207_website_creation_pro.organization_rate_periods
                        WHERE organization_id = %s
                        ORDER BY start_date DESC
                    """, (organization_id,))
                    
                    periods = []
                    for row in cur.fetchall():
                        periods.append({
                            'id': row[0],
                            'start_date': row[1].isoformat() if row[1] else None,
                            'end_date': row[2].isoformat() if row[2] else None,
                            'contact_rate': int(row[3]),
                            'payment_type': row[4],
                            'created_at': row[5].isoformat() if row[5] else None
                        })
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'periods': periods})
            }
        
        elif action == 'get_accounting_data':
            days_param = event.get('queryStringParameters', {}).get('days')
            date_filter = ''
            if days_param:
                try:
                    days = int(days_param)
                    date_filter = f"AND s.shift_date >= CURRENT_DATE - INTERVAL '{days} days'"
                except (ValueError, TypeError):
                    date_filter = ''
            else:
                date_filter = "AND s.shift_date >= '2025-01-01'"
            
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    query = f"""
                        SELECT 
                            s.shift_date,
                            COALESCE(
                                (SELECT (created_at AT TIME ZONE 'Europe/Moscow')::time 
                                 FROM t_p24058207_website_creation_pro.shift_videos 
                                 WHERE user_id = s.user_id AND work_date = s.shift_date 
                                 AND organization_id = s.organization_id AND video_type = 'start' 
                                 ORDER BY created_at LIMIT 1),
                                (s.shift_start AT TIME ZONE 'Europe/Moscow')::time
                            ) as start_time,
                            COALESCE(
                                (SELECT (created_at AT TIME ZONE 'Europe/Moscow')::time 
                                 FROM t_p24058207_website_creation_pro.shift_videos 
                                 WHERE user_id = s.user_id AND work_date = s.shift_date 
                                 AND organization_id = s.organization_id AND video_type = 'end' 
                                 ORDER BY created_at DESC LIMIT 1),
                                (s.shift_end AT TIME ZONE 'Europe/Moscow')::time
                            ) as end_time,
                            o.name as organization,
                            o.id as organization_id,
                            u.id as user_id,
                            u.name as user_name,
                            COALESCE(
                                (SELECT contact_rate FROM t_p24058207_website_creation_pro.organization_rate_periods 
                                 WHERE organization_id = o.id 
                                 AND start_date <= s.shift_date 
                                 AND (end_date IS NULL OR end_date >= s.shift_date)
                                 ORDER BY start_date DESC LIMIT 1),
                                o.contact_rate
                            ) as contact_rate,
                            COALESCE(
                                (SELECT payment_type FROM t_p24058207_website_creation_pro.organization_rate_periods 
                                 WHERE organization_id = o.id 
                                 AND start_date <= s.shift_date 
                                 AND (end_date IS NULL OR end_date >= s.shift_date)
                                 ORDER BY start_date DESC LIMIT 1),
                                o.payment_type
                            ) as payment_type,
                            COALESCE(ae.expense_amount, 0) as expense_amount,
                            COALESCE(ae.expense_comment, '') as expense_comment,
                            COALESCE(ae.paid_by_organization, false) as paid_by_organization,
                            COALESCE(ae.paid_to_worker, false) as paid_to_worker,
                            COALESCE(ae.salary_at_kvv, false) as salary_at_kvv,
                            COALESCE(ae.paid_kvv, false) as paid_kvv,
                            COALESCE(ae.paid_kms, false) as paid_kms,
                            COALESCE(ae.invoice_issued, false) as invoice_issued,
                            ae.invoice_issued_date,
                            COALESCE(ae.invoice_paid, false) as invoice_paid,
                            ae.invoice_paid_date,
                            COALESCE(ae.personal_funds_amount, 0) as personal_funds_amount,
                            COALESCE(ae.personal_funds_by_kms, false) as personal_funds_by_kms,
                            COALESCE(ae.personal_funds_by_kvv, false) as personal_funds_by_kvv,
                            COALESCE(ae.compensation_amount, 0) as compensation_amount
                        FROM t_p24058207_website_creation_pro.work_shifts s
                        JOIN t_p24058207_website_creation_pro.users u ON s.user_id = u.id
                        JOIN t_p24058207_website_creation_pro.organizations o ON s.organization_id = o.id
                        LEFT JOIN t_p24058207_website_creation_pro.accounting_expenses ae
                            ON ae.user_id = s.user_id
                            AND ae.work_date = s.shift_date
                            AND ae.organization_id = s.organization_id
                        WHERE 1=1 {date_filter}
                        ORDER BY s.shift_date DESC, u.name
                    """
                    cur.execute(query)
                    shifts_rows = cur.fetchall()
                    
                    # Получаем лиды для подсчёта контактов на Python-стороне
                    leads_query = """
                        SELECT 
                            user_id,
                            organization_id,
                            created_at,
                            lead_type
                        FROM t_p24058207_website_creation_pro.leads_analytics
                        WHERE is_active = true
                    """
                    cur.execute(leads_query)
                    leads_data = cur.fetchall()
                    
                    # Группируем лиды по user_id, organization_id и дате (московское время)
                    leads_by_shift = {}
                    for lead_row in leads_data:
                        user_id = lead_row[0]
                        org_id = lead_row[1]
                        created_at_utc = lead_row[2]
                        lead_type = lead_row[3]
                        
                        # Конвертируем UTC в московское время
                        if created_at_utc.tzinfo is None:
                            created_at_utc = created_at_utc.replace(tzinfo=pytz.UTC)
                        created_at_moscow = created_at_utc.astimezone(MOSCOW_TZ)
                        shift_date = created_at_moscow.date()
                        
                        key = (user_id, org_id, shift_date)
                        if key not in leads_by_shift:
                            leads_by_shift[key] = {'contacts': 0}
                        
                        if lead_type == 'контакт':
                            leads_by_shift[key]['contacts'] += 1
                    
                    shifts = []
                    for row in shifts_rows:
                        shift_date = row[0]
                        user_id = row[5]
                        org_id = row[4]
                        
                        # Подсчитываем контакты из сгруппированных данных
                        key = (user_id, org_id, shift_date)
                        contacts_count = leads_by_shift.get(key, {}).get('contacts', 0)
                        
                        shifts.append({
                            'date': shift_date.isoformat() if shift_date else None,
                            'start_time': str(row[1]) if row[1] else None,
                            'end_time': str(row[2]) if row[2] else None,
                            'organization': row[3],
                            'organization_name': row[3],
                            'organization_id': org_id,
                            'user_id': user_id,
                            'user_name': row[6],
                            'contacts_count': contacts_count,
                            'contact_rate': int(row[7]) if row[7] else 0,
                            'payment_type': row[8] if row[8] else 'cash',
                            'expense_amount': int(row[9]) if row[9] else 0,
                            'expense_comment': row[10] if row[10] else '',
                            'paid_by_organization': bool(row[11]),
                            'paid_to_worker': bool(row[12]),
                            'salary_at_kvv': bool(row[13]),
                            'paid_kvv': bool(row[14]),
                            'paid_kms': bool(row[15]),
                            'invoice_issued': bool(row[16]),
                            'invoice_issued_date': row[17].isoformat() if row[17] else None,
                            'invoice_paid': bool(row[18]),
                            'invoice_paid_date': row[19].isoformat() if row[19] else None,
                            'personal_funds_amount': int(row[20]) if row[20] else 0,
                            'personal_funds_by_kms': bool(row[21]),
                            'personal_funds_by_kvv': bool(row[22]),
                            'compensation_amount': int(row[23]) if row[23] else 0
                        })
            
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'shifts': shifts})
            }
        
        return {
            'statusCode': 400,
            'headers': headers,
            'body': json.dumps({'error': 'Неизвестное действие'})
        }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        print(f'📮 POST action: {action}, body: {body_data}')
        
        if action == 'approve_user':
            user_id = body_data.get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'ID пользователя обязателен'})
                }
            
            success = approve_user(user_id, user['id'])
            if success:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True, 'message': 'Пользователь одобрен'})
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Пользователь не найден'})
                }
        
        elif action == 'activate_user':
            user_id = body_data.get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'ID пользователя обязателен'})
                }
            
            success = activate_user(user_id)
            if success:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True, 'message': 'Пользователь активирован'})
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Пользователь не найден'})
                }
        
        elif action == 'reject_user':
            user_id = body_data.get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'ID пользователя обязателен'})
                }
            
            success = reject_user(user_id)
            if success:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True, 'message': 'Пользователь отклонён и заблокирован'})
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Пользователь не найден'})
                }
        
        elif action == 'delete_2025_data':
            # Проверяем права администратора
            if not user['is_admin']:
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Доступ запрещен'})
                }
            
            result = delete_year_2025_data()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True,
                    'message': f"Удалено данных за 2025 год: {result['deleted_leads']} лидов, {result['deleted_shifts']} смен, {result['deleted_videos']} видео",
                    'result': result
                })
            }
        
        elif action == 'get_user_revenue':
            email = body_data.get('email')
            
            if not email:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Email обязателен'})
                }
            
            org_revenues = get_user_revenue_details(email)
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True, 'org_revenues': org_revenues})
            }
        
        elif action == 'get_user_org_stats':
            email = body_data.get('email')
            
            if not email:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Email обязателен'})
                }
            
            org_stats = get_user_org_stats(email)
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True, 'org_stats': org_stats})
            }
        
        elif action == 'get_batch_user_org_stats':
            emails = body_data.get('emails')
            
            if not emails or not isinstance(emails, list):
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Список emails обязателен'})
                }
            
            batch_stats = get_batch_user_org_stats(emails)
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True, 'batch_stats': batch_stats})
            }
        
        elif action == 'get_user_org_shift_details':
            email = body_data.get('email')
            org_name = body_data.get('org_name')
            
            if not email or not org_name:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Email и org_name обязательны'})
                }
            
            shift_details = get_user_org_shift_details(email, org_name)
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True, 'shift_details': shift_details})
            }
        
        elif action == 'get_recent_contacts':
            email = body_data.get('email')
            limit = body_data.get('limit', 7)
            
            if not email:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Email обязателен'})
                }
            
            recent_contacts = get_recent_contacts(email, limit)
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True, 'recent_contacts': recent_contacts})
            }
        
        elif action == 'get_recent_contacts_org':
            email = body_data.get('email')
            org_name = body_data.get('org_name')
            limit = body_data.get('limit', 7)
            
            if not email or not org_name:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Email и org_name обязательны'})
                }
            
            recent_contacts = get_recent_contacts_org(email, org_name, limit)
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True, 'recent_contacts': recent_contacts})
            }
        
        elif action == 'get_user_shifts':
            email = body_data.get('email')
            
            if not email:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Email обязателен'})
                }
            
            shifts = get_user_shifts(email)
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True, 'shifts': shifts})
            }
        
        elif action == 'add_organization':
            name = body_data.get('name', '').strip()
            
            if not name:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Название организации обязательно'})
                }
            
            try:
                with get_db_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            "INSERT INTO t_p24058207_website_creation_pro.organizations (name) VALUES (%s) RETURNING id",
                            (name,)
                        )
                        org_id = cur.fetchone()[0]
                        conn.commit()
                        return {
                            'statusCode': 200,
                            'headers': headers,
                            'body': json.dumps({'success': True, 'id': org_id})
                        }
            except Exception as e:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': f'Ошибка добавления: {str(e)}'})
                }
        
        elif action == 'delete_organization':
            org_id = body_data.get('id')
            
            if not org_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'ID организации обязателен'})
                }
            
            try:
                with get_db_connection() as conn:
                    with conn.cursor() as cur:
                        # Проверяем существование организации
                        cur.execute(
                            "SELECT id, name FROM t_p24058207_website_creation_pro.organizations WHERE id = %s",
                            (org_id,)
                        )
                        org = cur.fetchone()
                        
                        if not org:
                            return {
                                'statusCode': 404,
                                'headers': headers,
                                'body': json.dumps({'error': 'Организация не найдена'})
                            }
                        
                        # Мягкое удаление через is_active
                        cur.execute(
                            "UPDATE t_p24058207_website_creation_pro.organizations SET is_active = false WHERE id = %s",
                            (org_id,)
                        )
                        conn.commit()
                        
                        return {
                            'statusCode': 200,
                            'headers': headers,
                            'body': json.dumps({'success': True, 'message': f'Организация "{org[1]}" деактивирована'})
                        }
            except Exception as e:
                print(f"❌ Error deleting organization: {e}")
                return {
                    'statusCode': 500,
                    'headers': headers,
                    'body': json.dumps({'error': f'Ошибка удаления: {str(e)}'})
                }
        
        elif action == 'update_organization':
            org_id = body_data.get('id')
            name = body_data.get('name', '').strip()
            contact_rate = body_data.get('contact_rate', 0)
            payment_type = body_data.get('payment_type', 'cash')
            
            if not org_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'ID организации обязателен'})
                }
            
            if not name:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Название организации обязательно'})
                }
            
            try:
                with get_db_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            "UPDATE t_p24058207_website_creation_pro.organizations SET name = %s, contact_rate = %s, payment_type = %s WHERE id = %s",
                            (name, contact_rate, payment_type, org_id)
                        )
                        conn.commit()
                        if cur.rowcount > 0:
                            return {
                                'statusCode': 200,
                                'headers': headers,
                                'body': json.dumps({'success': True})
                            }
                        else:
                            return {
                                'statusCode': 404,
                                'headers': headers,
                                'body': json.dumps({'error': 'Организация не найдена'})
                            }
            except Exception as e:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': f'Ошибка обновления: {str(e)}'})
                }
        
        elif action == 'add_schedule_slot':
            print(f'✅ Processing add_schedule_slot')
            user_id = body_data.get('user_id')
            organization_id = body_data.get('organization_id')
            work_date = body_data.get('work_date')
            time_slot = body_data.get('time_slot')
            
            if not all([user_id, organization_id, work_date, time_slot]):
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Все поля обязательны'})
                }
            
            try:
                # Определяем понедельник как начало недели
                date_obj = datetime.strptime(work_date, '%Y-%m-%d').date()
                # weekday(): Mon=0, Tue=1, ..., Sun=6
                days_since_monday = date_obj.weekday()
                week_start = date_obj - timedelta(days=days_since_monday)
                
                with get_db_connection() as conn:
                    with conn.cursor() as cur:
                        # Получаем текущий schedule или создаём пустой
                        cur.execute("""
                            SELECT schedule_data FROM t_p24058207_website_creation_pro.promoter_schedules
                            WHERE user_id = %s AND week_start_date = %s
                        """, (user_id, week_start))
                        
                        row = cur.fetchone()
                        if row:
                            schedule = row[0] if row[0] else {}
                        else:
                            schedule = {}
                        
                        # Добавляем слот в график
                        if work_date not in schedule:
                            schedule[work_date] = {}
                        
                        # Конвертируем time_slot в slotN формат
                        slot_key = 'slot1' if time_slot in ['12:00-16:00', '11:00-15:00', '09:00-12:00', '09:00-13:00'] else 'slot2'
                        schedule[work_date][slot_key] = True
                        
                        # Сохраняем обновлённый график
                        cur.execute("""
                            INSERT INTO t_p24058207_website_creation_pro.promoter_schedules 
                            (user_id, week_start_date, schedule_data, updated_at)
                            VALUES (%s, %s, %s, NOW())
                            ON CONFLICT (user_id, week_start_date) 
                            DO UPDATE SET 
                                schedule_data = EXCLUDED.schedule_data,
                                updated_at = NOW()
                        """, (user_id, week_start, json.dumps(schedule)))
                        conn.commit()
                        
                        return {
                            'statusCode': 200,
                            'headers': headers,
                            'body': json.dumps({'success': True, 'message': 'Смена добавлена в график'})
                        }
            except Exception as e:
                print(f'❌ Error adding schedule slot: {e}')
                return {
                    'statusCode': 500,
                    'headers': headers,
                    'body': json.dumps({'error': f'Ошибка при добавлении смены: {str(e)}'})
                }
        
        elif action == 'update_accounting_expense':
            user_id = body_data.get('user_id')
            work_date = body_data.get('work_date')
            organization_id = body_data.get('organization_id')
            expense_amount = body_data.get('expense_amount', 0)
            expense_comment = body_data.get('expense_comment', '')
            paid_by_organization = body_data.get('paid_by_organization', False)
            paid_to_worker = body_data.get('paid_to_worker', False)
            salary_at_kvv = body_data.get('salary_at_kvv', False)
            paid_kvv = body_data.get('paid_kvv', False)
            paid_kms = body_data.get('paid_kms', False)
            invoice_issued = body_data.get('invoice_issued', False)
            invoice_issued_date = body_data.get('invoice_issued_date')
            invoice_paid = body_data.get('invoice_paid', False)
            invoice_paid_date = body_data.get('invoice_paid_date')
            personal_funds_amount = body_data.get('personal_funds_amount', 0)
            personal_funds_by_kms = body_data.get('personal_funds_by_kms', False)
            personal_funds_by_kvv = body_data.get('personal_funds_by_kvv', False)
            compensation_amount = body_data.get('compensation_amount', 0)
            
            if not user_id or not work_date or not organization_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'user_id, work_date и organization_id обязательны'})
                }
            
            try:
                with get_db_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute("""
                            INSERT INTO t_p24058207_website_creation_pro.accounting_expenses 
                            (user_id, work_date, organization_id, expense_amount, expense_comment, 
                             paid_by_organization, paid_to_worker, salary_at_kvv, paid_kvv, paid_kms, invoice_issued, invoice_issued_date, 
                             invoice_paid, invoice_paid_date, personal_funds_amount, personal_funds_by_kms, personal_funds_by_kvv, compensation_amount, updated_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                            ON CONFLICT (user_id, work_date, organization_id) 
                            DO UPDATE SET 
                                expense_amount = EXCLUDED.expense_amount,
                                expense_comment = EXCLUDED.expense_comment,
                                paid_by_organization = EXCLUDED.paid_by_organization,
                                paid_to_worker = EXCLUDED.paid_to_worker,
                                salary_at_kvv = EXCLUDED.salary_at_kvv,
                                paid_kvv = EXCLUDED.paid_kvv,
                                paid_kms = EXCLUDED.paid_kms,
                                invoice_issued = EXCLUDED.invoice_issued,
                                invoice_issued_date = EXCLUDED.invoice_issued_date,
                                invoice_paid = EXCLUDED.invoice_paid,
                                invoice_paid_date = EXCLUDED.invoice_paid_date,
                                personal_funds_amount = EXCLUDED.personal_funds_amount,
                                personal_funds_by_kms = EXCLUDED.personal_funds_by_kms,
                                personal_funds_by_kvv = EXCLUDED.personal_funds_by_kvv,
                                compensation_amount = EXCLUDED.compensation_amount,
                                updated_at = CURRENT_TIMESTAMP
                        """, (user_id, work_date, organization_id, expense_amount, expense_comment,
                              paid_by_organization, paid_to_worker, salary_at_kvv, paid_kvv, paid_kms, invoice_issued, invoice_issued_date,
                              invoice_paid, invoice_paid_date, personal_funds_amount, personal_funds_by_kms, personal_funds_by_kvv, compensation_amount))
                        conn.commit()
                        
                        return {
                            'statusCode': 200,
                            'headers': headers,
                            'body': json.dumps({'success': True})
                        }
            except Exception as e:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': f'Ошибка обновления расхода: {str(e)}'})
                }
        
        elif action == 'delete_work_shift':
            user_id = body_data.get('user_id')
            work_date = body_data.get('work_date')
            organization_id = body_data.get('organization_id')
            
            if not user_id or not work_date or not organization_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'user_id, work_date и organization_id обязательны'})
                }
            
            if not user['is_admin']:
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Только админ может удалять смены'})
                }
            
            try:
                with get_db_connection() as conn:
                    with conn.cursor() as cur:
                        # Получаем имя пользователя для удаления комментариев
                        cur.execute("""
                            SELECT name FROM t_p24058207_website_creation_pro.users 
                            WHERE id = %s
                        """, (user_id,))
                        user_row = cur.fetchone()
                        user_name = user_row[0] if user_row else None
                        
                        # Удаляем смену из work_shifts
                        cur.execute("""
                            DELETE FROM t_p24058207_website_creation_pro.work_shifts 
                            WHERE user_id = %s AND shift_date = %s AND organization_id = %s
                        """, (user_id, work_date, organization_id))
                        
                        deleted_shifts = cur.rowcount
                        
                        # Удаляем комментарии о месте работы, если смена была удалена
                        if deleted_shifts > 0 and user_name:
                            print(f'🗑️ Удаление комментариев для {user_name} на {work_date}')
                            cur.execute("""
                                DELETE FROM work_location_comments 
                                WHERE user_name = %s AND work_date = %s
                            """, (user_name, work_date))
                            print(f'✅ Удалено {cur.rowcount} комментариев')
                        
                        conn.commit()
                        
                        if deleted_shifts > 0:
                            return {
                                'statusCode': 200,
                                'headers': headers,
                                'body': json.dumps({'success': True})
                            }
                        else:
                            return {
                                'statusCode': 404,
                                'headers': headers,
                                'body': json.dumps({'error': 'Смена не найдена'})
                            }
            except Exception as e:
                print(f'❌ Ошибка удаления смены: {e}')
                import traceback
                traceback.print_exc()
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': f'Ошибка удаления смены: {str(e)}'})
                }
        
        elif action == 'update_work_shift':
            old_user_id = body_data.get('old_user_id')
            old_work_date = body_data.get('old_work_date')
            old_organization_id = body_data.get('old_organization_id')
            
            new_user_id = body_data.get('new_user_id')
            new_work_date = body_data.get('new_work_date')
            new_organization_id = body_data.get('new_organization_id')
            start_time = body_data.get('start_time', '09:00')
            end_time = body_data.get('end_time', '18:00')
            contacts_count = body_data.get('contacts_count', 0)
            contact_rate = body_data.get('contact_rate', 0)
            payment_type = body_data.get('payment_type', 'cash')
            expense_amount = body_data.get('expense_amount', 0)
            expense_comment = body_data.get('expense_comment', '')
            paid_by_organization = body_data.get('paid_by_organization', False)
            paid_to_worker = body_data.get('paid_to_worker', False)
            paid_kvv = body_data.get('paid_kvv', False)
            paid_kms = body_data.get('paid_kms', False)
            
            if not old_user_id or not old_work_date or not old_organization_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Старые параметры обязательны'})
                }
            
            if not user['is_admin']:
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Только админ может редактировать смены'})
                }
            
            try:
                with get_db_connection() as conn:
                    with conn.cursor() as cur:
                        print(f"🔍 UPDATE params: old=({old_user_id}, {old_work_date}, {old_organization_id})")
                        print(f"🔍 UPDATE params: new=({new_user_id}, {new_work_date}, {new_organization_id})")
                        print(f"🔍 Times: start={start_time}, end={end_time}")
                        
                        # КРИТИЧНО: Блокируем строку смены для предотвращения race condition
                        cur.execute("""
                            SELECT id, user_id, shift_date, organization_id 
                            FROM t_p24058207_website_creation_pro.work_shifts
                            WHERE user_id = %s AND shift_date = %s AND organization_id = %s
                            FOR UPDATE
                        """, (old_user_id, old_work_date, old_organization_id))
                        
                        existing_shift = cur.fetchone()
                        if not existing_shift:
                            cur.execute("""
                                SELECT COUNT(*) 
                                FROM t_p24058207_website_creation_pro.accounting_expenses
                                WHERE user_id = %s AND work_date = %s AND organization_id = %s
                            """, (old_user_id, old_work_date, old_organization_id))
                            
                            accounting_exists = cur.fetchone()[0] > 0
                            if not accounting_exists:
                                print(f"❌ Shift NOT FOUND for update: user={old_user_id}, date={old_work_date}, org={old_organization_id}")
                                return {
                                    'statusCode': 404,
                                    'headers': headers,
                                    'body': json.dumps({'error': 'Смена не найдена для обновления'})
                                }
                        
                        shift_id = existing_shift[0] if existing_shift else None
                        if shift_id:
                            print(f"✅ Found shift: id={shift_id}")
                        else:
                            print(f"✅ Found accounting record only")
                        
                        start_time_normalized = start_time.split(':')[0] + ':' + start_time.split(':')[1]
                        end_time_normalized = end_time.split(':')[0] + ':' + end_time.split(':')[1]
                        
                        # КРИТИЧНО: Сначала проверяем сколько контактов есть
                        cur.execute("""
                            SELECT COUNT(*) FROM t_p24058207_website_creation_pro.leads_analytics
                            WHERE user_id = %s 
                            AND organization_id = %s 
                            AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')::date = %s
                            AND lead_type = 'контакт'
                        """, (old_user_id, old_organization_id, old_work_date))
                        
                        current_contacts = cur.fetchone()[0]
                        print(f"🔍 BEFORE DELETE: Found {current_contacts} contacts for user={old_user_id}, org={old_organization_id}, date={old_work_date}")
                        
                        # Удаляем ВСЕ контакты для этой смены (user + date + org)
                        # Используем московскую дату для корректного удаления
                        cur.execute("""
                            DELETE FROM t_p24058207_website_creation_pro.leads_analytics
                            WHERE user_id = %s 
                            AND organization_id = %s 
                            AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')::date = %s
                            AND lead_type = 'контакт'
                        """, (old_user_id, old_organization_id, old_work_date))
                        
                        deleted_count = cur.rowcount
                        print(f"✅ AFTER DELETE: Deleted {deleted_count} contacts (expected to delete all {current_contacts})")
                        
                        if deleted_count != current_contacts:
                            print(f"⚠️ WARNING: Mismatch! Expected {current_contacts}, deleted {deleted_count}")
                        
                        if shift_id:
                            cur.execute("""
                                DELETE FROM t_p24058207_website_creation_pro.work_shifts
                                WHERE id = %s
                            """, (shift_id,))
                            print(f"✅ Deleted old shift")
                        
                        cur.execute("""
                            DELETE FROM t_p24058207_website_creation_pro.accounting_expenses
                            WHERE user_id = %s AND work_date = %s AND organization_id = %s
                        """, (old_user_id, old_work_date, old_organization_id))
                        
                        print(f"✅ Deleted accounting record")
                        
                        conn.commit()
                        print(f"✅ Committed deletes")
                        
                        shift_start_dt = f"{new_work_date} {start_time_normalized}+03"
                        shift_end_dt = f"{new_work_date} {end_time_normalized}+03"
                        
                        cur.execute("""
                            INSERT INTO t_p24058207_website_creation_pro.work_shifts
                            (user_id, organization_id, shift_date, shift_start, shift_end)
                            VALUES (%s, %s, %s, %s::timestamptz, %s::timestamptz)
                        """, (
                            new_user_id, new_organization_id, new_work_date,
                            shift_start_dt, shift_end_dt
                        ))
                        
                        print(f"✅ Inserted new shift")
                        
                        invoice_issued = body_data.get('invoice_issued', False)
                        
                        cur.execute("""
                            INSERT INTO t_p24058207_website_creation_pro.accounting_expenses
                            (user_id, work_date, organization_id, expense_amount, expense_comment,
                             paid_by_organization, paid_to_worker, paid_kvv, paid_kms, invoice_issued,
                             created_at, updated_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
                        """, (
                            new_user_id, new_work_date, new_organization_id,
                            expense_amount, expense_comment,
                            paid_by_organization, paid_to_worker, paid_kvv, paid_kms, invoice_issued
                        ))
                        
                        print(f"✅ Inserted accounting record")
                        
                        # КРИТИЧНО: Проверяем что нет контактов до создания новых
                        cur.execute("""
                            SELECT COUNT(*) FROM t_p24058207_website_creation_pro.leads_analytics
                            WHERE user_id = %s 
                            AND organization_id = %s 
                            AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')::date = %s
                            AND lead_type = 'контакт'
                        """, (new_user_id, new_organization_id, new_work_date))
                        
                        remaining_contacts = cur.fetchone()[0]
                        if remaining_contacts > 0:
                            print(f"⚠️ WARNING: Found {remaining_contacts} remaining contacts after DELETE! This should be 0!")
                        
                        print(f"🔍 Creating contacts: contacts_count={contacts_count}")
                        
                        if contacts_count > 0:
                            moscow_tz = pytz.timezone('Europe/Moscow')
                            shift_date_obj = datetime.strptime(new_work_date, '%Y-%m-%d')
                            
                            # Парсим время начала и конца смены
                            start_parts = start_time.split(':')
                            start_hours = int(start_parts[0])
                            start_minutes = int(start_parts[1]) if len(start_parts) > 1 else 0
                            
                            end_parts = end_time.split(':')
                            end_hours = int(end_parts[0])
                            end_minutes = int(end_parts[1]) if len(end_parts) > 1 else 0
                            
                            from datetime import time as time_obj
                            shift_start_time = moscow_tz.localize(datetime.combine(
                                shift_date_obj, 
                                time_obj(start_hours, start_minutes)
                            ))
                            shift_end_time = moscow_tz.localize(datetime.combine(
                                shift_date_obj, 
                                time_obj(end_hours, end_minutes)
                            ))
                            
                            # Рассчитываем длительность смены в минутах
                            shift_duration_minutes = (shift_end_time - shift_start_time).total_seconds() / 60
                            
                            # КРИТИЧНО: Фиксированный интервал 1 минута между контактами
                            interval_minutes = 1
                            
                            print(f"🔍 Creating {contacts_count} contacts from {shift_start_time} (interval={interval_minutes} min)")
                            
                            for i in range(contacts_count):
                                # Контакты создаются с интервалом 1 минута
                                lead_time = shift_start_time + timedelta(minutes=interval_minutes * i)
                                lead_time_utc = lead_time.astimezone(pytz.UTC)
                                
                                cur.execute("""
                                    INSERT INTO t_p24058207_website_creation_pro.leads_analytics 
                                    (user_id, organization_id, lead_type, lead_result, created_at, is_active)
                                    VALUES (%s, %s, 'контакт', 'согласие', %s, true)
                                """, (new_user_id, new_organization_id, lead_time_utc))
                            
                            print(f"✅ Created {contacts_count} contacts")
                            
                            # КРИТИЧНО: Проверяем сколько контактов реально создалось
                            cur.execute("""
                                SELECT COUNT(*) FROM t_p24058207_website_creation_pro.leads_analytics
                                WHERE user_id = %s 
                                AND organization_id = %s 
                                AND (created_at AT TIME ZONE 'UTC' AT TIME ZONE 'Europe/Moscow')::date = %s
                                AND lead_type = 'контакт'
                            """, (new_user_id, new_organization_id, new_work_date))
                            
                            final_contacts = cur.fetchone()[0]
                            print(f"🔍 FINAL COUNT: {final_contacts} contacts in DB (expected {contacts_count})")
                            
                            if final_contacts != contacts_count:
                                print(f"⚠️ CRITICAL WARNING: Expected {contacts_count} but found {final_contacts} contacts!")
                        
                        conn.commit()
                        
                        return {
                            'statusCode': 200,
                            'headers': headers,
                            'body': json.dumps({'success': True})
                        }
            except Exception as e:
                import traceback
                error_details = traceback.format_exc()
                print(f"❌ Update shift error: {str(e)}")
                print(f"❌ Traceback: {error_details}")
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': f'Ошибка обновления смены: {str(e)}'})
                }

        elif action == 'add_manual_work_shift':
            user_id = body_data.get('user_id')
            organization_id = body_data.get('organization_id')
            shift_date = body_data.get('shift_date')
            start_time = body_data.get('start_time', '09:00')
            end_time = body_data.get('end_time', '18:00')
            contacts_count = body_data.get('contacts_count', 0)
            
            if not user_id or not organization_id or not shift_date:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'user_id, organization_id и shift_date обязательны'})
                }
            
            if not user['is_admin']:
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Только админ может добавлять смены вручную'})
                }
            
            try:
                with get_db_connection() as conn:
                    with conn.cursor() as cur:
                        shift_start_dt = f"{shift_date} {start_time}:00+03"
                        shift_end_dt = f"{shift_date} {end_time}:00+03"
                        
                        cur.execute("""
                            INSERT INTO t_p24058207_website_creation_pro.work_shifts 
                            (user_id, organization_id, shift_date, shift_start, shift_end)
                            VALUES (%s, %s, %s, %s::timestamptz, %s::timestamptz)
                        """, (user_id, organization_id, shift_date, shift_start_dt, shift_end_dt))
                        
                        if contacts_count > 0:
                            moscow_tz = pytz.timezone('Europe/Moscow')
                            shift_date_obj = datetime.strptime(shift_date, '%Y-%m-%d')
                            base_time = moscow_tz.localize(datetime.combine(shift_date_obj, datetime.strptime(start_time, '%H:%M').time()))
                            
                            for i in range(contacts_count):
                                lead_time = base_time + timedelta(minutes=30 * i)
                                lead_time_utc = lead_time.astimezone(pytz.UTC)
                                
                                cur.execute("""
                                    INSERT INTO t_p24058207_website_creation_pro.leads_analytics 
                                    (user_id, organization_id, lead_type, lead_result, created_at, is_active)
                                    VALUES (%s, %s, 'контакт', 'согласие', %s, true)
                                """, (user_id, organization_id, lead_time_utc))
                        
                        conn.commit()
                        
                        return {
                            'statusCode': 200,
                            'headers': headers,
                            'body': json.dumps({'success': True, 'contacts_added': contacts_count})
                        }
            except Exception as e:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': f'Ошибка добавления смены: {str(e)}'})
                }
        
        elif action == 'add_rate_period':
            organization_id = body_data.get('organization_id')
            start_date = body_data.get('start_date')
            end_date = body_data.get('end_date')
            contact_rate = body_data.get('contact_rate', 0)
            payment_type = body_data.get('payment_type', 'cash')
            
            if not organization_id or not start_date:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'ID организации и дата начала обязательны'})
                }
            
            try:
                with get_db_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute("""
                            INSERT INTO t_p24058207_website_creation_pro.organization_rate_periods 
                            (organization_id, start_date, end_date, contact_rate, payment_type)
                            VALUES (%s, %s, %s, %s, %s)
                        """, (organization_id, start_date, end_date if end_date else None, contact_rate, payment_type))
                        conn.commit()
                        
                        return {
                            'statusCode': 200,
                            'headers': headers,
                            'body': json.dumps({'success': True})
                        }
            except Exception as e:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': f'Ошибка добавления периода: {str(e)}'})
                }
        
        elif action == 'delete_rate_period':
            period_id = body_data.get('period_id')
            
            if not period_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'ID периода обязателен'})
                }
            
            try:
                with get_db_connection() as conn:
                    with conn.cursor() as cur:
                        cur.execute(
                            "DELETE FROM t_p24058207_website_creation_pro.organization_rate_periods WHERE id = %s",
                            (period_id,)
                        )
                        conn.commit()
                        
                        if cur.rowcount > 0:
                            return {
                                'statusCode': 200,
                                'headers': headers,
                                'body': json.dumps({'success': True})
                            }
                        else:
                            return {
                                'statusCode': 404,
                                'headers': headers,
                                'body': json.dumps({'error': 'Период не найден'})
                            }
            except Exception as e:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': f'Ошибка удаления периода: {str(e)}'})
                }
    
    elif method == 'PUT':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'update_user':
            user_id = body_data.get('user_id')
            new_name = body_data.get('name', '').strip()
            
            if not user_id or not new_name:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'ID пользователя и имя обязательны'})
                }
            
            success = update_user_name(user_id, new_name)
            if success:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True})
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Пользователь не найден'})
                }
    
    elif method == 'DELETE':
        # Проверяем права админа для DELETE операций
        if not user['is_admin']:
            return {
                'statusCode': 403,
                'headers': headers,
                'body': json.dumps({'error': 'Доступ запрещен'})
            }
        
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
        if action == 'delete_user':
            user_id = body_data.get('user_id')
            
            if not user_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'ID пользователя обязателен'})
                }
            
            success = delete_user(user_id)
            if success:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True})
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Пользователь не найден или является администратором'})
                }
        
        elif action == 'delete_lead':
            lead_id = body_data.get('lead_id')
            
            if not lead_id:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'ID лида обязателен'})
                }
            
            success = delete_lead(lead_id)
            if success:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True})
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': headers,
                    'body': json.dumps({'error': 'Лид не найден'})
                }
        
        elif action == 'delete_leads_by_date':
            user_id = body_data.get('user_id')
            date_str = body_data.get('date')
            
            if not user_id or not date_str:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'ID пользователя и дата обязательны'})
                }
            
            deleted_count = delete_leads_by_date(user_id, date_str)
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': True, 'deleted_count': deleted_count})
            }
        
        elif action == 'delete_shift':
            user_id = body_data.get('user_id')
            work_date = body_data.get('work_date')
            
            if not user_id or not work_date:
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'ID пользователя и дата обязательны'})
                }
            
            success = delete_shift_by_date(user_id, work_date)
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'success': success})
            }

        elif action == 'delete_approach':
            approach_id = body_data.get('approach_id')
            if not approach_id:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'approach_id required'})}
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM t_p24058207_website_creation_pro.leads WHERE id = %s", (int(approach_id),))
                    conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}

        elif action == 'delete_approach_lead':
            lead_id = body_data.get('lead_id')
            if not lead_id:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'lead_id required'})}
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("DELETE FROM t_p24058207_website_creation_pro.leads_analytics WHERE id = %s", (int(lead_id),))
                    conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}

        elif action == 'delete_approaches_by_date':
            user_id_del = body_data.get('user_id')
            date = body_data.get('date')
            if not user_id_del or not date:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'user_id and date required'})}
            try:
                day, month, year = date.split('.')
                date_iso = f"{year}-{month}-{day}"
                msk_start = datetime.strptime(date_iso, '%Y-%m-%d')
                msk_end = msk_start + timedelta(days=1)
                utc_start = msk_start - timedelta(hours=3)
                utc_end = msk_end - timedelta(hours=3)
            except Exception:
                return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Invalid date format'})}
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        DELETE FROM t_p24058207_website_creation_pro.leads
                        WHERE user_id = %s AND approaches > 0
                        AND created_at >= %s AND created_at < %s
                    """, (int(user_id_del), utc_start, utc_end))
                    cur.execute("""
                        DELETE FROM t_p24058207_website_creation_pro.leads_analytics
                        WHERE user_id = %s AND lead_type = 'контакт'
                        AND created_at >= %s AND created_at < %s
                    """, (int(user_id_del), utc_start, utc_end))
                    conn.commit()
            return {'statusCode': 200, 'headers': headers, 'body': json.dumps({'success': True})}

    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'Метод не поддерживается'})
    }