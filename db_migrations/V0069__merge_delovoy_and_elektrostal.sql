-- Переносим данные из ID 77 в ID 2 (Деловой Центр)

UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 2 
WHERE organization_id = 77;

UPDATE t_p24058207_website_creation_pro.leads 
SET organization_id = 2 
WHERE organization_id = 77;

UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET organization_id = 2 
WHERE organization_id = 77;

UPDATE t_p24058207_website_creation_pro.shift_videos 
SET organization_id = 2 
WHERE organization_id = 77;

UPDATE t_p24058207_website_creation_pro.work_shifts 
SET organization_id = 2 
WHERE organization_id = 77;

-- Переносим данные из ID 50 в ID 9 (Электросталь)

UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 9 
WHERE organization_id = 50;

UPDATE t_p24058207_website_creation_pro.leads 
SET organization_id = 9 
WHERE organization_id = 50;

UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET organization_id = 9 
WHERE organization_id = 50;

UPDATE t_p24058207_website_creation_pro.shift_videos 
SET organization_id = 9 
WHERE organization_id = 50;

UPDATE t_p24058207_website_creation_pro.work_shifts 
SET organization_id = 9 
WHERE organization_id = 50;