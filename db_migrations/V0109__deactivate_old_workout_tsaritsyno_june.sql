-- Деактивация старых контактов Воркаут Царицыно за июнь 2025
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE organization_id = 25
    AND lead_type = 'контакт'
    AND created_at >= '2025-06-01'
    AND created_at < '2025-07-01'
    AND is_active = true;