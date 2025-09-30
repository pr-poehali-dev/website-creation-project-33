-- Создаём новую таблицу для метрик лидов (без персональных данных)
-- Старая таблица leads остаётся, но использоваться не будет

CREATE TABLE IF NOT EXISTS leads_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    lead_type VARCHAR(50) NOT NULL,
    lead_result VARCHAR(50) NOT NULL,
    telegram_message_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Индексы для быстрой выборки статистики
CREATE INDEX IF NOT EXISTS idx_leads_analytics_user_id ON leads_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_leads_analytics_created_at ON leads_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_leads_analytics_type ON leads_analytics(lead_type);
CREATE INDEX IF NOT EXISTS idx_leads_analytics_result ON leads_analytics(lead_result);

-- Комментарии
COMMENT ON TABLE leads_analytics IS 'Метрики лидов без персональных данных (текст/аудио только в Telegram)';
COMMENT ON COLUMN leads_analytics.lead_type IS 'Тип: подход, контакт, продажа, отказ';
COMMENT ON COLUMN leads_analytics.lead_result IS 'Результат: положительный, нейтральный, отрицательный';
COMMENT ON COLUMN leads_analytics.telegram_message_id IS 'ID сообщения в Telegram для связи';