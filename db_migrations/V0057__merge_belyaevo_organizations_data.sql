-- Переносим все записи с организации "Топ Беляево" на "ТОП Беляево"
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 35 
WHERE organization_id = 26;