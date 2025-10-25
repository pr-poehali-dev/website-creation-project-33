-- Добавление правильных контактов Воркаут Царицыно за июнь 2025

-- Ярослав Демкин - 37 контактов
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6697, 25, 'контакт', 'положительный', '2025-06-15 10:00:00'::timestamp + (n || ' seconds')::interval, true
FROM generate_series(0, 36) n;

-- Филипп Олейник - 20 контактов
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6725, 25, 'контакт', 'положительный', '2025-06-15 11:00:00'::timestamp + (n || ' seconds')::interval, true
FROM generate_series(0, 19) n;

-- Артём - 15 контактов
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6712, 25, 'контакт', 'положительный', '2025-06-15 12:00:00'::timestamp + (n || ' seconds')::interval, true
FROM generate_series(0, 14) n;

-- Сергей - 13 контактов
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6761, 25, 'контакт', 'положительный', '2025-06-15 13:00:00'::timestamp + (n || ' seconds')::interval, true
FROM generate_series(0, 12) n;

-- Иван Кустарев - 12 контактов
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6679, 25, 'контакт', 'положительный', '2025-06-15 14:00:00'::timestamp + (n || ' seconds')::interval, true
FROM generate_series(0, 11) n;

-- Михаил Г - 11 контактов
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6688, 25, 'контакт', 'положительный', '2025-06-15 15:00:00'::timestamp + (n || ' seconds')::interval, true
FROM generate_series(0, 10) n;

-- Амир - 8 контактов
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6748, 25, 'контакт', 'положительный', '2025-06-15 16:00:00'::timestamp + (n || ' seconds')::interval, true
FROM generate_series(0, 7) n;

-- Иван - 8 контактов
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6753, 25, 'контакт', 'положительный', '2025-06-15 17:00:00'::timestamp + (n || ' seconds')::interval, true
FROM generate_series(0, 7) n;

-- Ульяна - 7 контактов
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6711, 25, 'контакт', 'положительный', '2025-06-15 18:00:00'::timestamp + (n || ' seconds')::interval, true
FROM generate_series(0, 6) n;