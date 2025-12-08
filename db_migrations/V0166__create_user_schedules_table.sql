-- Создание таблицы для хранения графиков работы промоутеров
CREATE TABLE IF NOT EXISTS t_p24058207_website_creation_pro.user_schedules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    week_start_date DATE NOT NULL,
    schedule_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_user_schedules_user_week 
ON t_p24058207_website_creation_pro.user_schedules(user_id, week_start_date);

COMMENT ON TABLE t_p24058207_website_creation_pro.user_schedules IS 'График работы промоутеров по неделям';
COMMENT ON COLUMN t_p24058207_website_creation_pro.user_schedules.schedule_data IS 'JSON с графиком: {"2025-12-09": {"12:00-16:00": 181}}';