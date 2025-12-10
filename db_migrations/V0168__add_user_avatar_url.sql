-- Добавляем поле avatar_url в таблицу users
ALTER TABLE t_p24058207_website_creation_pro.users 
ADD COLUMN IF NOT EXISTS avatar_url TEXT DEFAULT NULL;

-- Создаем индекс для быстрого поиска пользователей с аватарками
CREATE INDEX IF NOT EXISTS idx_users_avatar_url 
ON t_p24058207_website_creation_pro.users(avatar_url) 
WHERE avatar_url IS NOT NULL;