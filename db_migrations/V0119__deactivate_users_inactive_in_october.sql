CREATE TABLE IF NOT EXISTS t_p24058207_website_creation_pro.users_october_active AS
SELECT DISTINCT l.user_id
FROM t_p24058207_website_creation_pro.leads_analytics l
WHERE l.is_active = true
  AND l.created_at >= '2025-10-01';

UPDATE t_p24058207_website_creation_pro.users
SET is_active = false
WHERE id NOT IN (SELECT user_id FROM t_p24058207_website_creation_pro.users_october_active)
  AND id > 1
  AND is_active = true