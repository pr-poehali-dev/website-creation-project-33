-- Добавление недостающих контактов за сентябрь 2025

-- 01.09.2025 Диана Гумерова 36 контактов КиберВан Балашиха
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 15, 55, 'контакт', 'положительный', '2025-09-01 00:00:00'::timestamp + (n || ' seconds')::interval, true
FROM generate_series(0, 35) n;

-- 18.09.2025 Галина Игнатенко 4 контакта КиберВан Балашиха  
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6787, 55, 'контакт', 'положительный', '2025-09-18 10:00:00'::timestamp + (n || ' seconds')::interval, true
FROM generate_series(0, 3) n;