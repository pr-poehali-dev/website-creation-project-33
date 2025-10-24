-- Объединение КиберВан Электросталь (ID 50) в KIBERONE (Электросталь) (ID 9)

-- Переносим данные из всех связанных таблиц
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

-- Обновляем название в оставшейся организации
UPDATE t_p24058207_website_creation_pro.organizations 
SET name = 'KIBERONE (Электросталь)' 
WHERE id = 9;

-- Помечаем дубликат как неактивный
UPDATE t_p24058207_website_creation_pro.organizations 
SET name = '[УДАЛЕНО] КиберВан Электросталь' 
WHERE id = 50;