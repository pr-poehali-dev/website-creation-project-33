-- Fix reversed name order: Slepchenko Daniil -> Daniil Slepchenko
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics
SET promoter_name = 'Даниил Слепченко'
WHERE promoter_name = 'Слепченко Даниил';