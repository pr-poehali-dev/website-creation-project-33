-- Переносим все записи с ID 27 и ID 30 на ID 28 (Худ.Гимн. Люблино)
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 28 
WHERE organization_id IN (27, 30);