-- Устанавливаем telegram_chat_id для главного администратора
UPDATE t_p24058207_website_creation_pro.users 
SET telegram_chat_id = '5215501225' 
WHERE id = 1 AND is_admin = TRUE;