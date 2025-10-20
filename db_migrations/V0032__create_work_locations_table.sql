-- Создание таблицы для хранения уникальных мест работы
CREATE TABLE IF NOT EXISTS work_locations (
    id SERIAL PRIMARY KEY,
    location_name VARCHAR(255) NOT NULL UNIQUE,
    usage_count INT DEFAULT 1,
    last_used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска по названию места
CREATE INDEX idx_work_locations_name ON work_locations(location_name);

-- Индекс для сортировки по частоте использования
CREATE INDEX idx_work_locations_usage ON work_locations(usage_count DESC, last_used_at DESC);