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
                LEFT JOIN t_p24058207_website_creation_pro.leads_analytics l ON u.id = l.user_id
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
            """)
            total_leads = cur.fetchone()[0]
            
            # Контакты
            cur.execute("""
                SELECT COUNT(*) 
                FROM t_p24058207_website_creation_pro.leads_analytics l
                JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
                WHERE l.lead_type = 'контакт'
            """)
            contacts = cur.fetchone()[0]
            
            # Подходы
            cur.execute("""
                SELECT COUNT(*) 
                FROM t_p24058207_website_creation_pro.leads_analytics l
                JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
                WHERE l.lead_type = 'подход'
            """)
            approaches = cur.fetchone()[0]
            
            # Статистика по пользователям
            cur.execute("""
                SELECT u.name, u.email,
                       COUNT(l.id) as lead_count,
                       COUNT(CASE WHEN l.lead_type = 'контакт' THEN 1 END) as contacts,
                       COUNT(CASE WHEN l.lead_type = 'подход' THEN 1 END) as approaches
                FROM t_p24058207_website_creation_pro.users u
                LEFT JOIN t_p24058207_website_creation_pro.leads_analytics l ON u.id = l.user_id
                GROUP BY u.id, u.name, u.email
                HAVING COUNT(l.id) > 0
                ORDER BY lead_count DESC
            """)
            
            user_stats = []
            for row in cur.fetchall():
                user_stats.append({
                    'name': row[0],
                    'email': row[1], 
                    'lead_count': row[2],
                    'contacts': row[3],
                    'approaches': row[4]
                })
            
            # Статистика за последние 30 дней (только от реальных пользователей)
            # Получаем все лиды и группируем по московской дате на Python стороне
            cur.execute("""
                SELECT l.created_at, l.lead_type
                FROM t_p24058207_website_creation_pro.leads_analytics l
                JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
                WHERE l.created_at >= %s
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
                WHERE l.created_at IS NOT NULL
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
                WHERE l.created_at >= %s
                ORDER BY l.created_at DESC
            """, (get_moscow_time() - timedelta(days=30),))
            
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
                    'нейтральный': '⚪',
                    'отрицательный': '❌'
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
    """Удалить пользователя и ВСЕ связанные данные (метрики лидов, чат, сессии), заблокировать IP"""
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT registration_ip FROM t_p24058207_website_creation_pro.users WHERE id = %s", (user_id,))
            row = cur.fetchone()
            user_ip = row[0] if row else None
            
            if user_ip and user_ip != 'unknown':
                cur.execute(
                    "INSERT INTO t_p24058207_website_creation_pro.blocked_ips (ip_address, blocked_reason) VALUES (%s, %s) ON CONFLICT (ip_address) DO NOTHING",
                    (user_ip, f'User ID {user_id} deleted by admin')
                )
            
            # Удаляем метрики лидов (текст/аудио не хранятся, только в Telegram!)
            cur.execute("DELETE FROM t_p24058207_website_creation_pro.leads_analytics WHERE user_id = %s", (user_id,))
            
            # Удаляем сессии
            cur.execute("DELETE FROM t_p24058207_website_creation_pro.user_sessions WHERE user_id = %s", (user_id,))
            
            # Удаляем чат
            cur.execute("DELETE FROM t_p24058207_website_creation_pro.chat_messages WHERE user_id = %s", (user_id,))
            
            # Удаляем пользователя (только не админов)
            cur.execute("DELETE FROM t_p24058207_website_creation_pro.users WHERE id = %s AND is_admin = FALSE", (user_id,))
            
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
            # Получаем все лиды пользователя и фильтруем по московской дате
            cur.execute("""
                SELECT id, created_at 
                FROM t_p24058207_website_creation_pro.leads_analytics 
                WHERE user_id = %s
            """, (user_id,))
            
            # Находим ID лидов, которые попадают в заданную московскую дату
            lead_ids_to_delete = []
            for row in cur.fetchall():
                moscow_dt = get_moscow_time_from_utc(row[1])
                date_key = moscow_dt.date().isoformat()
                
                if date_key == date_str:
                    lead_ids_to_delete.append(row[0])
            
            # Удаляем найденные лиды
            if lead_ids_to_delete:
                placeholders = ','.join(['%s'] * len(lead_ids_to_delete))
                cur.execute(f"""
                    DELETE FROM t_p24058207_website_creation_pro.leads_analytics 
                    WHERE id IN ({placeholders})
                """, lead_ids_to_delete)
                conn.commit()
                return cur.rowcount
            
            return 0

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

def reset_all_selected_organizations() -> int:
    """Сбросить выбранные организации у всех промоутеров (не админов)"""
    moscow_now = get_moscow_time()
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                UPDATE t_p24058207_website_creation_pro.users 
                SET selected_organization_id = NULL, 
                    selected_organization_date = %s
                WHERE is_admin = FALSE
            """, (moscow_now.date(),))
            conn.commit()
            return cur.rowcount

def check_organization_selection(user_id: int) -> Dict[str, Any]:
    """Проверить, нужно ли пользователю заново выбрать организацию"""
    moscow_today = get_moscow_time().date()
    with get_db_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("""
                SELECT selected_organization_id, selected_organization_date
                FROM t_p24058207_website_creation_pro.users 
                WHERE id = %s
            """, (user_id,))
            row = cur.fetchone()
            
            if not row:
                return {'needs_selection': True, 'reason': 'user_not_found'}
            
            selected_org_id = row[0]
            selected_date = row[1]
            
            # Если организация не выбрана
            if selected_org_id is None:
                # Проверяем, был ли сброс сегодня
                if selected_date and selected_date == moscow_today:
                    return {'needs_selection': True, 'reason': 'reset_by_admin', 'reset_date': str(selected_date)}
                return {'needs_selection': True, 'reason': 'not_selected'}
            
            return {'needs_selection': False, 'selected_organization_id': selected_org_id}

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
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
                        SELECT o.id, o.name, o.created_at,
                               COUNT(l.id) as lead_count
                        FROM t_p24058207_website_creation_pro.organizations o
                        LEFT JOIN t_p24058207_website_creation_pro.leads_analytics l ON o.id = l.organization_id
                        GROUP BY o.id, o.name, o.created_at
                        ORDER BY lead_count DESC, o.name
                    """)
                    organizations = []
                    for row in cur.fetchall():
                        organizations.append({
                            'id': row[0],
                            'name': row[1],
                            'created_at': row[2].isoformat() if row[2] else None,
                            'lead_count': row[3]
                        })
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({'organizations': organizations})
            }
        
        # Проверка статуса выбора организации (доступен для всех)
        if action == 'check_organization_selection':
            check_result = check_organization_selection(user['id'])
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps(check_result)
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
                    'body': json.dumps({'error': 'Неверный user_id'})
                }
    
    elif method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        action = body_data.get('action')
        
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
        
        elif action == 'reset_selected_organizations':
            if not user['is_admin']:
                return {
                    'statusCode': 403,
                    'headers': headers,
                    'body': json.dumps({'error': 'Требуются права администратора'})
                }
            
            count = reset_all_selected_organizations()
            return {
                'statusCode': 200,
                'headers': headers,
                'body': json.dumps({
                    'success': True, 
                    'message': f'Сброшено выбранных организаций: {count}',
                    'count': count
                })
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

    return {
        'statusCode': 405,
        'headers': headers,
        'body': json.dumps({'error': 'Метод не поддерживается'})
    }