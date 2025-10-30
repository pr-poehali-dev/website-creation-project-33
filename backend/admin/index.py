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

def get_all_users() -> List[Dict[str, Any]]:
    """Получить всех пользователей с информацией об онлайн статусе и количеством лидов"""
    online_threshold = get_moscow_time() - timedelta(minutes=5)
    
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT u.id, u.email, u.name, u.is_admin, u.last_seen, u.created_at,
                       CASE WHEN u.last_seen > %s THEN true ELSE false END as is_online,
                       COUNT(l.id) as lead_count,
                       u.latitude, u.longitude, u.location_city, u.location_country
                FROM t_p24058207_website_creation_pro.users u 
                LEFT JOIN t_p24058207_website_creation_pro.leads_analytics l ON u.id = l.user_id AND l.is_active = true
                WHERE u.is_active = TRUE
                GROUP BY u.id, u.email, u.name, u.is_admin, u.last_seen, u.created_at, u.latitude, u.longitude, u.location_city, u.location_country
                ORDER BY u.created_at DESC
            """, (online_threshold,))
            
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
                    'location_country': row[11]
                })
            
            # Вычисляем смены для каждого пользователя отдельным запросом
            for user in users:
                if user['lead_count'] > 0:
                    cur.execute("""
                        SELECT l.created_at, l.organization_id
                        FROM t_p24058207_website_creation_pro.leads_analytics l
                        WHERE l.user_id = %s AND l.is_active = true
                        ORDER BY l.created_at DESC
                    """, (user['id'],))
                    
                    # Группируем по московским датам + организация
                    shift_combinations = set()
                    last_shift_date = None
                    for lead_row in cur.fetchall():
                        moscow_dt = get_moscow_time_from_utc(lead_row[0])
                        moscow_date = moscow_dt.date()
                        org_id = lead_row[1]
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
    return users

def get_moscow_time_from_utc(utc_time):
    """Конвертировать UTC время в московское"""
    if utc_time.tzinfo is None:
        utc_time = utc_time.replace(tzinfo=pytz.UTC)
    return utc_time.astimezone(MOSCOW_TZ)

def get_leads_stats() -> Dict[str, Any]:
    """Получить статистику по лидам из leads_analytics (AI классификация)"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Общая статистика (только от реальных пользователей)
            cur.execute("""
                SELECT COUNT(*) 
                FROM t_p24058207_website_creation_pro.leads_analytics l
                JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
                WHERE l.is_active = true
            """)
            total_leads = cur.fetchone()[0]
            
            # Контакты
            cur.execute("""
                SELECT COUNT(*) 
                FROM t_p24058207_website_creation_pro.leads_analytics l
                JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
                WHERE l.lead_type = 'контакт' AND l.is_active = true
            """)
            contacts = cur.fetchone()[0]
            
            # Подходы
            cur.execute("""
                SELECT COUNT(*) 
                FROM t_p24058207_website_creation_pro.leads_analytics l
                JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
                WHERE l.lead_type = 'подход' AND l.is_active = true
            """)
            approaches = cur.fetchone()[0]
            
            # Статистика по пользователям
            cur.execute("""
                SELECT u.id, u.name, u.email,
                       COUNT(l.id) as lead_count,
                       COUNT(CASE WHEN l.lead_type = 'контакт' THEN 1 END) as contacts,
                       COUNT(CASE WHEN l.lead_type = 'подход' THEN 1 END) as approaches
                FROM t_p24058207_website_creation_pro.users u
                LEFT JOIN t_p24058207_website_creation_pro.leads_analytics l ON u.id = l.user_id AND l.is_active = true
                GROUP BY u.id, u.name, u.email
                HAVING COUNT(l.id) > 0
                ORDER BY lead_count DESC
            """)
            
            user_stats = []
            for row in cur.fetchall():
                user_id = row[0]
                lead_count = row[3]
                
                # Вычисляем смены для пользователя (дата + организация)
                cur.execute("""
                    SELECT l.created_at, l.organization_id
                    FROM t_p24058207_website_creation_pro.leads_analytics l
                    WHERE l.user_id = %s AND l.is_active = true
                """, (user_id,))
                
                shift_combinations = set()
                for lead_row in cur.fetchall():
                    moscow_dt = get_moscow_time_from_utc(lead_row[0])
                    moscow_date = moscow_dt.date()
                    org_id = lead_row[1]
                    shift_combinations.add((moscow_date, org_id))
                
                shifts = len(shift_combinations)
                avg_per_shift = round(lead_count / shifts) if shifts > 0 else 0
                
                user_stats.append({
                    'name': row[1],
                    'email': row[2], 
                    'lead_count': lead_count,
                    'contacts': row[4],
                    'approaches': row[5],
                    'shifts_count': shifts,
                    'avg_per_shift': avg_per_shift
                })
            
            # Статистика за последние 30 дней (только от реальных пользователей)
            # Получаем все лиды и группируем по московской дате на Python стороне
            cur.execute("""
                SELECT l.created_at, l.lead_type
                FROM t_p24058207_website_creation_pro.leads_analytics l
                JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
                WHERE l.created_at >= %s AND l.is_active = true
                ORDER BY l.created_at DESC
            """, (get_moscow_time() - timedelta(days=30),))
            
            # Группируем по московским датам
            daily_groups = {}
            for row in cur.fetchall():
                moscow_dt = get_moscow_time_from_utc(row[0])
                date_key = moscow_dt.date().isoformat()
                
                if date_key not in daily_groups:
                    daily_groups[date_key] = {'count': 0, 'contacts': 0, 'approaches': 0}
                
                daily_groups[date_key]['count'] += 1
                if row[1] == 'контакт':
                    daily_groups[date_key]['contacts'] += 1
                elif row[1] == 'подход':
                    daily_groups[date_key]['approaches'] += 1
            
            # Преобразуем в список и сортируем
            daily_stats = []
            for date_key, stats in sorted(daily_groups.items(), reverse=True):
                daily_stats.append({
                    'date': date_key,
                    'count': stats['count'],
                    'contacts': stats['contacts'],
                    'approaches': stats['approaches']
                })
    
    return {
        'total_leads': total_leads,
        'contacts': contacts,
        'approaches': approaches,
        'user_stats': user_stats,
        'daily_stats': daily_stats
    }

def get_daily_user_stats(date: str) -> List[Dict[str, Any]]:
    """Получить статистику пользователей за конкретный день (московская дата)"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            # Получаем все лиды и фильтруем по московской дате на Python стороне
            cur.execute("""
                SELECT u.id, u.name, u.email, l.created_at, l.lead_type
                FROM t_p24058207_website_creation_pro.users u 
                LEFT JOIN t_p24058207_website_creation_pro.leads_analytics l ON u.id = l.user_id 
                WHERE l.created_at IS NOT NULL AND l.is_active = true
            """)
            
            # Группируем по пользователям для заданной московской даты
            user_groups = {}
            for row in cur.fetchall():
                moscow_dt = get_moscow_time_from_utc(row[3])
                date_key = moscow_dt.date().isoformat()
                
                if date_key != date:
                    continue
                
                user_id = row[0]
                if user_id not in user_groups:
                    user_groups[user_id] = {
                        'name': row[1],
                        'email': row[2],
                        'lead_count': 0,
                        'contacts': 0,
                        'approaches': 0
                    }
                
                user_groups[user_id]['lead_count'] += 1
                if row[4] == 'контакт':
                    user_groups[user_id]['contacts'] += 1
                elif row[4] == 'подход':
                    user_groups[user_id]['approaches'] += 1
            
            # Преобразуем в список и сортируем
            user_stats = sorted(user_groups.values(), key=lambda x: x['lead_count'], reverse=True)
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
    """Получить детальные данные для графика по дням и пользователям (московские даты)"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT l.created_at, u.name, l.lead_type
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
                
                key = (date_key, user_name)
                if key not in groups:
                    groups[key] = {'total_leads': 0, 'contacts': 0, 'approaches': 0}
                
                groups[key]['total_leads'] += 1
                if lead_type == 'контакт':
                    groups[key]['contacts'] += 1
                elif lead_type == 'подход':
                    groups[key]['approaches'] += 1
            
            # Преобразуем в список
            chart_data = []
            for (date_key, user_name), stats in groups.items():
                chart_data.append({
                    'date': date_key,
                    'user_name': user_name,
                    'total_leads': stats['total_leads'],
                    'contacts': stats['contacts'],
                    'approaches': stats['approaches']
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
                    l.lead_type
                FROM t_p24058207_website_creation_pro.leads_analytics l
                JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
                LEFT JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
                WHERE l.created_at >= %s AND l.lead_type = 'контакт' AND l.is_active = true
                ORDER BY l.created_at DESC
            """, (get_moscow_time() - timedelta(days=365),))
            
            # Группируем по дате, пользователю и организации
            groups = {}
            for row in cur.fetchall():
                moscow_dt = get_moscow_time_from_utc(row[0])
                date_key = moscow_dt.date().isoformat()
                user_name = row[1]
                org_name = row[2] if row[2] else 'Не указана'
                org_id = row[3] if row[3] else 0
                
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
                
                org_stats.append({
                    'date': date_key,
                    'organization_name': org_name,
                    'organization_id': org_id,
                    'total_contacts': stats['total_contacts'],
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
            cur.execute("""
                SELECT 
                    sv.user_id,
                    u.name as user_name,
                    sv.work_date,
                    MIN(CASE WHEN sv.video_type = 'start' THEN sv.created_at END) as shift_start,
                    MAX(CASE WHEN sv.video_type = 'end' THEN sv.created_at END) as shift_end,
                    sv.organization_id
                FROM t_p24058207_website_creation_pro.shift_videos sv
                JOIN t_p24058207_website_creation_pro.users u ON sv.user_id = u.id
                GROUP BY sv.user_id, u.name, sv.work_date, sv.organization_id
                ORDER BY sv.work_date DESC, u.name
            """)
            
            work_time_data = []
            for row in cur.fetchall():
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
                
                cur.execute(
                    "SELECT COUNT(*) FROM t_p24058207_website_creation_pro.leads_analytics WHERE user_id = %s AND DATE(created_at) = %s AND organization_id = %s",
                    (user_id, work_date, organization_id)
                )
                leads_count_result = cur.fetchone()
                leads_count = leads_count_result[0] if leads_count_result else 0
                
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
                
                print(f'📅 Work time record: user_id={user_id}, work_date={work_date}, formatted={date_str}, start={start_time_str}')
            
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
        
        with get_db_connection() as conn:
            with conn.cursor() as cur:
                cur.execute("""
                    INSERT INTO t_p24058207_website_creation_pro.shift_videos 
                    (user_id, work_date, video_type, created_at, organization_id)
                    VALUES 
                    (%s, %s, 'start', %s, 1),
                    (%s, %s, 'end', %s, 1)
                """, (user_id, work_date, start_utc, user_id, work_date, end_utc))
                conn.commit()
                return True
    except Exception as e:
        print(f"Error adding manual shift: {e}")
        return False

def delete_shift_by_date(user_id: int, work_date: str) -> bool:
    """Удалить информацию о смене (открытие/закрытие) для конкретного дня и пользователя"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                DELETE FROM t_p24058207_website_creation_pro.shift_videos 
                WHERE user_id = %s AND work_date = %s
            """, (user_id, work_date))
            conn.commit()
            return cur.rowcount > 0

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
                total_contacts = sum(data['daily_contacts'].values())
                shifts = len(data['shift_dates'])
                
                if shifts > 0:
                    avg_per_shift = round(total_contacts / shifts, 1)
                else:
                    avg_per_shift = 0.0
                
                org_stats.append({
                    'organization_name': org_name,
                    'contacts': total_contacts,
                    'shifts': shifts,
                    'avg_per_shift': avg_per_shift
                })
            
            org_stats.sort(key=lambda x: x['avg_per_shift'], reverse=True)
            return org_stats

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
    return delete_user(user_id)

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
            users = get_all_users()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'users': users})
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
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute("""
                        SELECT 
                            s.shift_date,
                            (SELECT (created_at AT TIME ZONE 'Europe/Moscow')::time 
                             FROM t_p24058207_website_creation_pro.shift_videos 
                             WHERE user_id = s.user_id AND work_date = s.shift_date 
                             AND organization_id = s.organization_id AND video_type = 'start' 
                             ORDER BY created_at LIMIT 1) as start_time,
                            (SELECT (created_at AT TIME ZONE 'Europe/Moscow')::time 
                             FROM t_p24058207_website_creation_pro.shift_videos 
                             WHERE user_id = s.user_id AND work_date = s.shift_date 
                             AND organization_id = s.organization_id AND video_type = 'end' 
                             ORDER BY created_at DESC LIMIT 1) as end_time,
                            o.name as organization,
                            o.id as organization_id,
                            u.id as user_id,
                            u.name as user_name,
                            COUNT(CASE WHEN l.lead_type = '\u043a\u043e\u043d\u0442\u0430\u043a\u0442' THEN 1 END) as contacts_count,
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
                            COALESCE(ae.paid_kvv, false) as paid_kvv,
                            COALESCE(ae.paid_kms, false) as paid_kms
                        FROM t_p24058207_website_creation_pro.work_shifts s
                        JOIN t_p24058207_website_creation_pro.users u ON s.user_id = u.id
                        JOIN t_p24058207_website_creation_pro.organizations o ON s.organization_id = o.id
                        LEFT JOIN t_p24058207_website_creation_pro.leads_analytics l 
                            ON l.user_id = s.user_id 
                            AND l.created_at::date = s.shift_date
                            AND l.organization_id = s.organization_id
                            AND l.is_active = true
                        LEFT JOIN t_p24058207_website_creation_pro.accounting_expenses ae
                            ON ae.user_id = s.user_id
                            AND ae.work_date = s.shift_date
                            AND ae.organization_id = s.organization_id
                        GROUP BY s.shift_date, s.user_id, s.organization_id, o.name, o.id, 
                                 u.id, u.name, ae.id, ae.expense_amount, ae.expense_comment,
                                 ae.paid_by_organization, ae.paid_to_worker, ae.paid_kvv, ae.paid_kms
                        ORDER BY s.shift_date DESC, u.name
                    """)
                    
                    shifts = []
                    for row in cur.fetchall():
                        shifts.append({
                            'date': row[0].isoformat() if row[0] else None,
                            'start_time': str(row[1]) if row[1] else None,
                            'end_time': str(row[2]) if row[2] else None,
                            'organization': row[3],
                            'organization_id': row[4],
                            'user_id': row[5],
                            'user_name': row[6],
                            'contacts_count': int(row[7]),
                            'contact_rate': int(row[8]) if row[8] else 0,
                            'payment_type': row[9] if row[9] else 'cash',
                            'expense_amount': int(row[10]) if row[10] else 0,
                            'expense_comment': row[11] if row[11] else '',
                            'paid_by_organization': bool(row[12]),
                            'paid_to_worker': bool(row[13]),
                            'paid_kvv': bool(row[14]),
                            'paid_kms': bool(row[15])
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
            
            with get_db_connection() as conn:
                with conn.cursor() as cur:
                    cur.execute(
                        "DELETE FROM t_p24058207_website_creation_pro.organizations WHERE id = %s",
                        (org_id,)
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
        
        elif action == 'add_shift':
            print(f'✅ Processing add_shift')
            user_id = body_data.get('user_id')
            work_date = body_data.get('work_date')
            start_time = body_data.get('start_time')
            end_time = body_data.get('end_time')
            
            if not all([user_id, work_date, start_time, end_time]):
                return {
                    'statusCode': 400,
                    'headers': headers,
                    'body': json.dumps({'error': 'Все поля обязательны'})
                }
            
            success = add_manual_shift(user_id, work_date, start_time, end_time)
            print(f'✅ add_manual_shift result: {success}')
            if success:
                return {
                    'statusCode': 200,
                    'headers': headers,
                    'body': json.dumps({'success': True})
                }
            else:
                return {
                    'statusCode': 500,
                    'headers': headers,
                    'body': json.dumps({'error': 'Ошибка при добавлении смены'})
                }
        
        elif action == 'update_accounting_expense':
            user_id = body_data.get('user_id')
            work_date = body_data.get('work_date')
            organization_id = body_data.get('organization_id')
            expense_amount = body_data.get('expense_amount', 0)
            expense_comment = body_data.get('expense_comment', '')
            paid_by_organization = body_data.get('paid_by_organization', False)
            paid_to_worker = body_data.get('paid_to_worker', False)
            paid_kvv = body_data.get('paid_kvv', False)
            paid_kms = body_data.get('paid_kms', False)
            
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
                             paid_by_organization, paid_to_worker, paid_kvv, paid_kms, updated_at)
                            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                            ON CONFLICT (user_id, work_date, organization_id) 
                            DO UPDATE SET 
                                expense_amount = EXCLUDED.expense_amount,
                                expense_comment = EXCLUDED.expense_comment,
                                paid_by_organization = EXCLUDED.paid_by_organization,
                                paid_to_worker = EXCLUDED.paid_to_worker,
                                paid_kvv = EXCLUDED.paid_kvv,
                                paid_kms = EXCLUDED.paid_kms,
                                updated_at = CURRENT_TIMESTAMP
                        """, (user_id, work_date, organization_id, expense_amount, expense_comment,
                              paid_by_organization, paid_to_worker, paid_kvv, paid_kms))
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
                        cur.execute("""
                            DELETE FROM t_p24058207_website_creation_pro.work_shifts 
                            WHERE user_id = %s AND shift_date = %s AND organization_id = %s
                        """, (user_id, work_date, organization_id))
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
                                'body': json.dumps({'error': 'Смена не найдена'})
                            }
            except Exception as e:
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
                        
                        cur.execute("""
                            SELECT id, user_id, shift_date, organization_id 
                            FROM t_p24058207_website_creation_pro.work_shifts
                            WHERE user_id = %s AND shift_date = %s AND organization_id = %s
                        """, (old_user_id, old_work_date, old_organization_id))
                        
                        existing_shift = cur.fetchone()
                        if not existing_shift:
                            print(f"❌ Shift NOT FOUND for update: user={old_user_id}, date={old_work_date}, org={old_organization_id}")
                            return {
                                'statusCode': 404,
                                'headers': headers,
                                'body': json.dumps({'error': 'Смена не найдена для обновления'})
                            }
                        
                        shift_id = existing_shift[0]
                        print(f"✅ Found shift: id={shift_id}")
                        
                        start_time_normalized = start_time.split(':')[0] + ':' + start_time.split(':')[1]
                        end_time_normalized = end_time.split(':')[0] + ':' + end_time.split(':')[1]
                        
                        cur.execute("""
                            DELETE FROM t_p24058207_website_creation_pro.leads_analytics
                            WHERE user_id = %s AND organization_id = %s 
                            AND DATE(created_at AT TIME ZONE 'Europe/Moscow') = %s
                        """, (old_user_id, old_organization_id, old_work_date))
                        
                        print(f"✅ Deleted contacts")
                        
                        cur.execute("""
                            DELETE FROM t_p24058207_website_creation_pro.work_shifts
                            WHERE id = %s
                        """, (shift_id,))
                        
                        print(f"✅ Deleted old shift")
                        
                        conn.commit()
                        print(f"✅ Committed deletes")
                        
                        shift_start_dt = f"{new_work_date} {start_time_normalized}+03"
                        shift_end_dt = f"{new_work_date} {end_time_normalized}+03"
                        
                        cur.execute("""
                            INSERT INTO t_p24058207_website_creation_pro.work_shifts
                            (user_id, organization_id, shift_date, shift_start, shift_end,
                             expense_amount, expense_comment, paid_by_organization, 
                             paid_to_worker, paid_kvv, paid_kms)
                            VALUES (%s, %s, %s, %s::timestamptz, %s::timestamptz, %s, %s, %s, %s, %s, %s)
                        """, (
                            new_user_id, new_organization_id, new_work_date,
                            shift_start_dt, shift_end_dt,
                            expense_amount, expense_comment,
                            paid_by_organization, paid_to_worker, paid_kvv, paid_kms
                        ))
                        
                        print(f"✅ Inserted new shift")
                        
                        if contacts_count > 0:
                            moscow_tz = pytz.timezone('Europe/Moscow')
                            shift_date_obj = datetime.strptime(new_work_date, '%Y-%m-%d')
                            
                            time_parts = start_time.split(':')
                            hours = int(time_parts[0])
                            minutes = int(time_parts[1]) if len(time_parts) > 1 else 0
                            
                            from datetime import time as time_obj
                            base_time = moscow_tz.localize(datetime.combine(
                                shift_date_obj, 
                                time_obj(hours, minutes)
                            ))
                            
                            for i in range(contacts_count):
                                lead_time = base_time + timedelta(minutes=30 * i)
                                lead_time_utc = lead_time.astimezone(pytz.UTC)
                                
                                cur.execute("""
                                    INSERT INTO t_p24058207_website_creation_pro.leads_analytics 
                                    (user_id, organization_id, lead_type, lead_result, created_at, is_active)
                                    VALUES (%s, %s, 'контакт', 'согласие', %s, true)
                                """, (new_user_id, new_organization_id, lead_time_utc))
                        
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

    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'Метод не поддерживается'})
    }