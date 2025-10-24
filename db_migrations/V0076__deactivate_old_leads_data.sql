-- Деактивируем старые записи за период март-октябрь 2025
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE created_at >= '2025-03-15 00:00:00'
  AND created_at < '2025-10-25 00:00:00'
  AND lead_type = 'контакт'
  AND is_active = true;