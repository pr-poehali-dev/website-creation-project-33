-- Создаём новую таблицу для хранения ТОЛЬКО метрик лидов (без персональных данных)
-- Старая таблица leads остаётся, но мы её не будем использовать

CREATE TABLE IF NOT EXISTS t_p24058207_website_creation_pro.leads_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    lead_type VARCHAR(50) NOT NULL,
    lead_result VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    telegram_message_id BIGINT
);

-- Индексы для быстрой статистики
CREATE INDEX idx_leads_analytics_user_type ON t_p24058207_website_creation_pro.leads_analytics(user_id, lead_type);
CREATE INDEX idx_leads_analytics_user_result ON t_p24058207_website_creation_pro.leads_analytics(user_id, lead_result);
CREATE INDEX idx_leads_analytics_created_at ON t_p24058207_website_creation_pro.leads_analytics(created_at);
CREATE INDEX idx_leads_analytics_user_date ON t_p24058207_website_creation_pro.leads_analytics(user_id, created_at DESC);

-- Комментарии
COMMENT ON TABLE t_p24058207_website_creation_pro.leads_analytics IS 'Метрики лидов без персональных данных. Текст и аудио хранятся только в Telegram';
COMMENT ON COLUMN t_p24058207_website_creation_pro.leads_analytics.lead_type IS 'Тип: контакт/подход/продажа/отказ (AI классификация)';
COMMENT ON COLUMN t_p24058207_website_creation_pro.leads_analytics.lead_result IS 'Результат: положительный/нейтральный/отрицательный (AI классификация)';
COMMENT ON COLUMN t_p24058207_website_creation_pro.leads_analytics.telegram_message_id IS 'ID сообщения в Telegram для ссылки на полный лид';