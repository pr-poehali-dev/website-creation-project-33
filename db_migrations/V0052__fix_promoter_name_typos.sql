-- Исправляем опечатки в именах промоутеров
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics
SET promoter_name = 'Евгений Абулкин'
WHERE promoter_name = 'Евгений Аблулкин';

UPDATE t_p24058207_website_creation_pro.archive_leads_analytics
SET promoter_name = 'Даниил Слепченко'
WHERE promoter_name = 'Слепченко Даниил';

UPDATE t_p24058207_website_creation_pro.archive_leads_analytics
SET promoter_name = 'Владислава Долматова'
WHERE promoter_name LIKE 'Владислава%Долматова' AND promoter_name != 'Владислава Долматова';