-- Создаем таблицу для хранения QR-кодов пользователей
CREATE TABLE IF NOT EXISTS user_qr_codes (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    qr_code_url TEXT NOT NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uploaded_by INTEGER REFERENCES users(id),
    UNIQUE(user_id)
);