-- Создание таблицы для комментариев о местах работы промоутеров
CREATE TABLE IF NOT EXISTS work_location_comments (
    id SERIAL PRIMARY KEY,
    user_name VARCHAR(255) NOT NULL,
    work_date DATE NOT NULL,
    location_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_name, work_date)
);

-- Индекс для быстрого поиска по пользователю и дате
CREATE INDEX idx_work_location_user_date ON work_location_comments(user_name, work_date);

-- Индекс для поиска по дате
CREATE INDEX idx_work_location_date ON work_location_comments(work_date);