-- Добавляем поле telegram_chat_id для связи пользователя с Telegram
ALTER TABLE t_p24058207_website_creation_pro.users 
ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(255);

-- Создаем таблицу для хранения временных 2FA кодов
CREATE TABLE IF NOT EXISTS t_p24058207_website_creation_pro.two_factor_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    code VARCHAR(6) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    ip_address VARCHAR(50)
);

-- Индекс для быстрого поиска активных кодов
CREATE INDEX IF NOT EXISTS idx_2fa_codes_user_active 
ON t_p24058207_website_creation_pro.two_factor_codes(user_id, is_used, expires_at);