
-- Деактивируем старую корректировочную смену (2025-01-01, org_id=169)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE user_id = 6839 
  AND organization_id = 169
  AND created_at::date = '2025-01-01';
