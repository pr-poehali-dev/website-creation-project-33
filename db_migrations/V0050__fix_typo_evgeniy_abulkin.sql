-- Fix typo in Evgeniy's last name (Ablulkin -> Abulkin)
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics
SET promoter_name = 'Евгений Абулкин'
WHERE promoter_name = 'Евгений Аблулкин';