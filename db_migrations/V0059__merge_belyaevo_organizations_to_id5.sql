-- Переносим все записи с ID 26 и ID 35 на ID 5 (ТОП (Беляево))
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 5 
WHERE organization_id IN (26, 35);