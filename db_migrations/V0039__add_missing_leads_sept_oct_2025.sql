-- Добавление недостающих записей из таблицы Excel за сентябрь-октябрь 2025

-- 29.09.2025 - Ольга Салтыкова, Сотка, 5 контактов
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at)
SELECT 42, 1, 'approach', 'completed', '2025-09-29 22:47:46+00'
FROM generate_series(1, 5);

-- 29.09.2025 - Владислава Долматова, Сотка, 5 контактов
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at)
SELECT 7, 1, 'approach', 'completed', '2025-09-29 22:48:11+00'
FROM generate_series(1, 5);

-- 29.09.2025 - Кристина Маркаускайте, ТОП Щелковская, 5 контактов
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at)
SELECT 8, 21, 'approach', 'completed', '2025-09-29 22:49:18+00'
FROM generate_series(1, 5);

-- 02.10.2025 - Кристина Маркаускайте, Сотка, 0 контактов (пропускаем - 0 контактов)

-- 04.10.2025 - Артём Сушко, Сотка, 2 контакта
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at)
SELECT 59, 1, 'approach', 'completed', '2025-10-04 23:25:17+00'
FROM generate_series(1, 2);

-- 06.10.2025 - Кристина Маркаускайте, KIBERONE Бабушкинская, 4 контакта
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at)
SELECT 8, 3, 'approach', 'completed', '2025-10-06 17:47:22+00'
FROM generate_series(1, 4);

-- 11.10.2025 - Владислава Долматова, ТОП Тушинская, 8 контактов
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at)
SELECT 7, 15, 'approach', 'completed', '2025-10-11 19:03:00+00'
FROM generate_series(1, 8);

-- 20.10.2025 - Анастасия Войнова, Сотка, 3 контакта
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at)
SELECT 49, 1, 'approach', 'completed', '2025-10-20 23:59:00+00'
FROM generate_series(1, 3);