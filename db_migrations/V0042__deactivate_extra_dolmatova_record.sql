-- Деактивация лишней записи Долматовой 15.10 (ТОП Коломенская)
-- В Excel этой записи нет, поэтому помечаем как неактивную

UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET is_active = false 
WHERE id = 589;