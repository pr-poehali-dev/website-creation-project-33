-- Добавление недостающих 89 контактов за июнь 2025

-- 01.06.2025 15:20:44 Воркаут Царицыно Артём 5
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6712, o.id, 'контакт', 'положительный', '2025-06-01 12:20:44'::timestamp, true
FROM t_p24058207_website_creation_pro.organizations o
WHERE o.name = 'Воркаут Царицыно'
UNION ALL SELECT 6712, o.id, 'контакт', 'положительный', '2025-06-01 12:20:45'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'Воркаут Царицыно'
UNION ALL SELECT 6712, o.id, 'контакт', 'положительный', '2025-06-01 12:20:46'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'Воркаут Царицыно'
UNION ALL SELECT 6712, o.id, 'контакт', 'положительный', '2025-06-01 12:20:47'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'Воркаут Царицыно'
UNION ALL SELECT 6712, o.id, 'контакт', 'положительный', '2025-06-01 12:20:48'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'Воркаут Царицыно';

-- 01.06.2025 21:18:31 ТОП Севастопольская Анастасия +8
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6742, o.id, 'контакт', 'положительный', '2025-06-01 18:18:31'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'ТОП Севастопольская'
UNION ALL SELECT 6742, o.id, 'контакт', 'положительный', '2025-06-01 18:18:32'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'ТОП Севастопольская'
UNION ALL SELECT 6742, o.id, 'контакт', 'положительный', '2025-06-01 18:18:33'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'ТОП Севастопольская'
UNION ALL SELECT 6742, o.id, 'контакт', 'положительный', '2025-06-01 18:18:34'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'ТОП Севастопольская'
UNION ALL SELECT 6742, o.id, 'контакт', 'положительный', '2025-06-01 18:18:35'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'ТОП Севастопольская'
UNION ALL SELECT 6742, o.id, 'контакт', 'положительный', '2025-06-01 18:18:36'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'ТОП Севастопольская'
UNION ALL SELECT 6742, o.id, 'контакт', 'положительный', '2025-06-01 18:18:37'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'ТОП Севастопольская'
UNION ALL SELECT 6742, o.id, 'контакт', 'положительный', '2025-06-01 18:18:38'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'ТОП Севастопольская';

-- 01.06.2025 21:21:37 Воркаут Царицыно Артём 5
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6712, o.id, 'контакт', 'положительный', '2025-06-01 18:21:37'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'Воркаут Царицыно'
UNION ALL SELECT 6712, o.id, 'контакт', 'положительный', '2025-06-01 18:21:38'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'Воркаут Царицыно'
UNION ALL SELECT 6712, o.id, 'контакт', 'положительный', '2025-06-01 18:21:39'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'Воркаут Царицыно'
UNION ALL SELECT 6712, o.id, 'контакт', 'положительный', '2025-06-01 18:21:40'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'Воркаут Царицыно'
UNION ALL SELECT 6712, o.id, 'контакт', 'положительный', '2025-06-01 18:21:41'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'Воркаут Царицыно';

-- 07.06.2025 13:21:40 ТОП Мытищи Анастасия 12
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6742, o.id, 'контакт', 'положительный', '2025-06-07 10:21:40'::timestamp + (n || ' seconds')::interval, true
FROM t_p24058207_website_creation_pro.organizations o, generate_series(0, 11) n
WHERE o.name = 'ТОП Мытищи';

-- 07.06.2025 13:21:40 ТОП Мытищи Сергей 27
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6761, o.id, 'контакт', 'положительный', '2025-06-07 10:21:40'::timestamp + (n || ' seconds')::interval, true
FROM t_p24058207_website_creation_pro.organizations o, generate_series(0, 26) n
WHERE o.name = 'ТОП Мытищи';

-- 07.06.2025 13:21:40 ТОП Мытищи Андрей 12
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6780, o.id, 'контакт', 'положительный', '2025-06-07 10:21:40'::timestamp + (n || ' seconds')::interval, true
FROM t_p24058207_website_creation_pro.organizations o, generate_series(0, 11) n
WHERE o.name = 'ТОП Мытищи';

-- 20.06.2025 23:11:00 ТОП Щелково Мария 2
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6743, o.id, 'контакт', 'положительный', '2025-06-20 20:11:00'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'ТОП Щелково'
UNION ALL SELECT 6743, o.id, 'контакт', 'положительный', '2025-06-20 20:11:01'::timestamp, true FROM t_p24058207_website_creation_pro.organizations o WHERE o.name = 'ТОП Щелково';

-- 14.06.2025 17:22:18 ТОП Севастопольская Иван (1-й день) 12
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6753, o.id, 'контакт', 'положительный', '2025-06-14 14:22:18'::timestamp + (n || ' seconds')::interval, true
FROM t_p24058207_website_creation_pro.organizations o, generate_series(0, 11) n
WHERE o.name = 'ТОП Севастопольская';