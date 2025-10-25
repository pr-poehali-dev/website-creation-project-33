-- Откат: активируем обратно все контакты
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = true
WHERE lead_type = 'контакт'
  AND created_at >= '2025-03-14'
  AND created_at < '2025-10-25';