
-- Активируем обратно корректировочные лиды (171, 172)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = true
WHERE user_id = 6839 
  AND organization_id IN (171, 172);
