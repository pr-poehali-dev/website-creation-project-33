-- Конвертация всех временных меток в московское время (UTC+3)
-- Это необратимая операция, которая устранит проблемы с часовыми поясами

UPDATE t_p24058207_website_creation_pro.leads_analytics
SET created_at = created_at + interval '3 hours'
WHERE created_at IS NOT NULL;