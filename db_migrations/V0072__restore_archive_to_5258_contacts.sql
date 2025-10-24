-- Возвращаем архив к состоянию 5258 контактов
-- Исключаем дубликаты КиберВан (50, 74, 77, 78) которые дублируют KIBERONE

UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET is_excluded = TRUE 
WHERE organization_id IN (50, 74, 77, 78) 
  AND (is_excluded = FALSE OR is_excluded IS NULL);