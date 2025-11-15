
-- Деактивируем все корректировочные лиды
-- чтобы они не учитывались в расчёте зарплаты
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE user_id = 6839 
  AND organization_id IN (169, 171, 172);
