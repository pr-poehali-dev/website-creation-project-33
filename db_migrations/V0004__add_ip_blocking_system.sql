-- Добавить колонку registration_ip в таблицу users
ALTER TABLE t_p24058207_website_creation_pro.users 
ADD COLUMN registration_ip VARCHAR(45);

-- Создать таблицу для заблокированных IP адресов
CREATE TABLE t_p24058207_website_creation_pro.blocked_ips (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    blocked_reason TEXT,
    blocked_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Создать индекс для быстрого поиска по IP
CREATE INDEX idx_blocked_ips_address ON t_p24058207_website_creation_pro.blocked_ips(ip_address);

COMMENT ON TABLE t_p24058207_website_creation_pro.blocked_ips IS 'Список заблокированных IP адресов для предотвращения повторной регистрации';
COMMENT ON COLUMN t_p24058207_website_creation_pro.users.registration_ip IS 'IP адрес при регистрации пользователя';