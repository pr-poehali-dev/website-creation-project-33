-- Добавление поддержки медиафайлов в чат
ALTER TABLE t_p24058207_website_creation_pro.chat_messages 
ADD COLUMN media_type VARCHAR(10),
ADD COLUMN media_url TEXT;