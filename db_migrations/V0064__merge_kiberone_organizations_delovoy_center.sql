-- Объединение КиберВан Деловой Центр (ID 77) в KIBERONE (Деловой Центр) (ID 2)

-- Переносим данные из всех связанных таблиц
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

-- Обновляем название в оставшейся организации
UPDATE t_p24058207_website_creation_pro.organizations 
SET name = 'KIBERONE (Деловой Центр)' 
WHERE id = 2;

-- Помечаем дубликат как неактивный
UPDATE t_p24058207_website_creation_pro.organizations 
SET name = '[УДАЛЕНО] КиберВан Деловой Центр' 
WHERE id = 77;