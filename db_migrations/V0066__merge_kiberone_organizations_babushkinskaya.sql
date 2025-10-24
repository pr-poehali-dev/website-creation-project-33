-- Объединение КиберВан Бабушкинкая (ID 78) в KIBERONE (Бабушкинская) (ID 3)

-- Переносим данные из всех связанных таблиц
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

-- Обновляем название в оставшейся организации
UPDATE t_p24058207_website_creation_pro.organizations 
SET name = 'KIBERONE (Бабушкинская)' 
WHERE id = 3;

-- Помечаем дубликат как неактивный
UPDATE t_p24058207_website_creation_pro.organizations 
SET name = '[УДАЛЕНО] КиберВан Бабушкинкая' 
WHERE id = 78;