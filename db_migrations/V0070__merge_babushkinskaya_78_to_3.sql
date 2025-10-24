-- Переносим данные из ID 78 в ID 3 (Бабушкинская)

UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 3 
WHERE organization_id = 78;

UPDATE t_p24058207_website_creation_pro.leads 
SET organization_id = 3 
WHERE organization_id = 78;

UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET organization_id = 3 
WHERE organization_id = 78;

UPDATE t_p24058207_website_creation_pro.shift_videos 
SET organization_id = 3 
WHERE organization_id = 78;

UPDATE t_p24058207_website_creation_pro.work_shifts 
SET organization_id = 3 
WHERE organization_id = 78;