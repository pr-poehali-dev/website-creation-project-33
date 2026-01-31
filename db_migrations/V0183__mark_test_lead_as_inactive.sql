-- Пометить тестовый системный контакт как неактивный
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id = 19310 AND user_id = 999;