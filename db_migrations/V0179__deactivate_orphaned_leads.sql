-- Деактивация мусорных лидов с несуществующими пользователями
-- Лид ID 19187 с user_id = 999 (пользователь не существует)

UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET is_active = false
WHERE id = 19187 AND user_id = 999;

-- Дополнительная очистка: деактивируем все лиды с несуществующими пользователями
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET is_active = false
WHERE NOT EXISTS (
    SELECT 1 FROM t_p24058207_website_creation_pro.users 
    WHERE users.id = leads_analytics.user_id
) AND is_active = true;