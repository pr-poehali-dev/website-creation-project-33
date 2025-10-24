-- Переносим все данные из ID 74 в ID 10

UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 10 
WHERE organization_id = 74;

UPDATE t_p24058207_website_creation_pro.leads 
SET organization_id = 10 
WHERE organization_id = 74;

UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET organization_id = 10 
WHERE organization_id = 74;

UPDATE t_p24058207_website_creation_pro.shift_videos 
SET organization_id = 10 
WHERE organization_id = 74;

UPDATE t_p24058207_website_creation_pro.work_shifts 
SET organization_id = 10 
WHERE organization_id = 74;