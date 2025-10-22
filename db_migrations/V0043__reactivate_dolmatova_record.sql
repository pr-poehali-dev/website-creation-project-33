-- Восстановление записи Долматовой 15.10 (ТОП Коломенская)
-- Запись была деактивирована ошибочно

UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET is_active = true 
WHERE id = 589;