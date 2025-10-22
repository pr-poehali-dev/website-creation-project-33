-- Добавление поля is_active для управления активностью записей
ALTER TABLE t_p24058207_website_creation_pro.leads_analytics 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Устанавливаем все существующие записи как активные
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET is_active = true 
WHERE is_active IS NULL;