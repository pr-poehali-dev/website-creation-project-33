-- Перенос данных аналитики лидов из неактивного аккаунта Филиппа Олейника в активный
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET user_id = 6812 
WHERE user_id = 6725;

-- Деактивация старого аккаунта после переноса данных
UPDATE t_p24058207_website_creation_pro.users 
SET email = 'archived_6725_' || email 
WHERE id = 6725;