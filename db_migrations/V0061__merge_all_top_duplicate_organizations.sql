-- Коломенская: объединяем в ID 4
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 4 
WHERE organization_id = 70;

-- Домодедовская: объединяем в ID 14
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 14 
WHERE organization_id = 37;

-- Митино: объединяем в ID 16
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 16 
WHERE organization_id = 60;

-- Ногинск: объединяем в ID 11
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 11 
WHERE organization_id = 53;

-- Реутов: объединяем в ID 18
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 18 
WHERE organization_id = 49;

-- Речной: объединяем в ID 8
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 8 
WHERE organization_id = 45;

-- Тушинская: объединяем в ID 15
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 15 
WHERE organization_id = 69;

-- Щелковская: объединяем в ID 21
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 21 
WHERE organization_id = 61;

-- Юго-Западная: объединяем в ID 6
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 6 
WHERE organization_id = 75;

-- Воскресенск: объединяем в ID 19
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 19 
WHERE organization_id = 51;

-- Перово: объединяем ID 42 и 56 в ID 17
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 17 
WHERE organization_id IN (42, 56);