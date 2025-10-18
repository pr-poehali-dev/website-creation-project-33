-- Добавить поле для отслеживания даты сброса администратором
ALTER TABLE t_p24058207_website_creation_pro.users 
ADD COLUMN last_reset_date TIMESTAMP;

CREATE INDEX idx_users_last_reset_date ON t_p24058207_website_creation_pro.users(last_reset_date);

COMMENT ON COLUMN t_p24058207_website_creation_pro.users.last_reset_date IS 'Дата и время последнего сброса организации администратором';