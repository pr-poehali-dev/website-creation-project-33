-- Объединение КиберВан Биберево (ID 74) в KIBERONE (Бибирево) (ID 10)

-- Переносим данные из всех связанных таблиц
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

-- Обновляем название в оставшейся организации
UPDATE t_p24058207_website_creation_pro.organizations 
SET name = 'KIBERONE (Бибирево)' 
WHERE id = 10;

-- Помечаем дубликат как неактивный (добавляем префикс для архива)
UPDATE t_p24058207_website_creation_pro.organizations 
SET name = '[УДАЛЕНО] КиберВан Биберево' 
WHERE id = 74;