-- Исправление контактов Артёма в Воркаут Царицыно за июнь 2025 (с 15 на 10)

-- Деактивируем все текущие контакты Артёма за июнь
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE user_id = 6712
    AND organization_id = 25
    AND lead_type = 'контакт'
    AND created_at >= '2025-06-01'
    AND created_at < '2025-07-01'
    AND is_active = true;

-- Добавляем правильное количество - 10 контактов
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6712, 25, 'контакт', 'положительный', '2025-06-15 12:00:00'::timestamp + (n || ' seconds')::interval, true
FROM generate_series(0, 9) n;