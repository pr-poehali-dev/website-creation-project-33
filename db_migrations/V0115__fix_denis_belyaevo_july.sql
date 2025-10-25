-- Активация второй записи Дениса в ТОП (Беляево) за июль
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = true
WHERE id = 13897;

-- Добавление третьей записи для Дениса
INSERT INTO t_p24058207_website_creation_pro.leads_analytics 
    (user_id, organization_id, lead_type, lead_result, created_at, is_active)
VALUES 
    (6758, 5, 'контакт', 'контакт', '2025-07-03 00:00:01', true);