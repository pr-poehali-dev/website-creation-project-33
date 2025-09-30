-- Делаем lead_result опциональным (разрешаем NULL)
ALTER TABLE t_p24058207_website_creation_pro.leads_analytics 
ALTER COLUMN lead_result SET DEFAULT NULL;

-- Обновляем существующие записи где lead_result пустой
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET lead_result = NULL 
WHERE lead_result = '';