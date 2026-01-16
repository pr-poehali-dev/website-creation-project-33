-- Принудительный выход Анны Королевой (user_id=6853) через обновление expires_at
UPDATE t_p24058207_website_creation_pro.user_sessions 
SET expires_at = NOW() - INTERVAL '1 day'
WHERE user_id = 6853;