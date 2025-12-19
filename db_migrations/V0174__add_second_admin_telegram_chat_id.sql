-- Добавляем telegram_chat_id для второго администратора
UPDATE t_p24058207_website_creation_pro.users 
SET telegram_chat_id = '1526249125' 
WHERE id = 2 AND is_admin = TRUE;