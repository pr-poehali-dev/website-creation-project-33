UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE user_id = 999
  AND is_active = true
  AND created_at >= '2026-05-08 21:00:00';