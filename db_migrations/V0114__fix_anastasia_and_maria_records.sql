-- Деактивация лишних записей Анастасии (ТОП Севастопольская, июнь)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (6727, 6728, 6729, 6730, 6731, 6732, 6733, 6734);

-- Деактивация лишних записей Марии (ТОП Щелково, 20.06)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (16977, 16978);