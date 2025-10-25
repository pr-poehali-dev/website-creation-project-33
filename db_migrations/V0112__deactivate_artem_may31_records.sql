-- Деактивация записей Артёма за 31 мая (которые попадают в 01 июня по МСК)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (6722, 6723, 6724, 6725, 6726);