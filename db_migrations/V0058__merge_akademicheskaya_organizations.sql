-- Переносим все записи с ID 29 и ID 34 на ID 7 (ТОП (Академическая))
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 7 
WHERE organization_id IN (29, 34);