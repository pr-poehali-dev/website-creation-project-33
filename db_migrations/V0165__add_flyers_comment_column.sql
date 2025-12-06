-- Добавление поля для учета листовок
ALTER TABLE t_p24058207_website_creation_pro.work_location_comments
ADD COLUMN IF NOT EXISTS flyers_comment text;