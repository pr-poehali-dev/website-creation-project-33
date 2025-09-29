-- Добавить статус модерации для пользователей
ALTER TABLE t_p24058207_website_creation_pro.users 
ADD COLUMN is_approved BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN approved_at TIMESTAMP,
ADD COLUMN approved_by INTEGER REFERENCES t_p24058207_website_creation_pro.users(id);

-- Установить всех существующих пользователей как одобренных
UPDATE t_p24058207_website_creation_pro.users 
SET is_approved = TRUE, approved_at = CURRENT_TIMESTAMP;

-- Создать индекс для быстрого поиска неодобренных пользователей
CREATE INDEX idx_users_not_approved ON t_p24058207_website_creation_pro.users(is_approved, created_at) WHERE is_approved = FALSE;

COMMENT ON COLUMN t_p24058207_website_creation_pro.users.is_approved IS 'Одобрен ли пользователь администратором';
COMMENT ON COLUMN t_p24058207_website_creation_pro.users.approved_at IS 'Дата и время одобрения';
COMMENT ON COLUMN t_p24058207_website_creation_pro.users.approved_by IS 'ID администратора, который одобрил пользователя';