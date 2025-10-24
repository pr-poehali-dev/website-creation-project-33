-- Удаляем дубль записи Галины Игнатенко от 18.09.2025
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET is_excluded = TRUE 
WHERE id = 7212;