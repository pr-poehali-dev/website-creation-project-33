-- Активация недостающих 8 записей Салтыковой за 18 сентября
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = true
WHERE id IN (10961, 10962, 10963, 10964, 10965, 10966, 10967, 10968);