-- Создание таблицы для архивных данных лидов
CREATE TABLE IF NOT EXISTS t_p24058207_website_creation_pro.archive_leads_analytics (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p24058207_website_creation_pro.users(id),
    organization_id INTEGER REFERENCES t_p24058207_website_creation_pro.organizations(id),
    lead_type VARCHAR(50) NOT NULL,
    contact_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL,
    notes TEXT,
    CONSTRAINT archive_leads_check_lead_type CHECK (lead_type IN ('контакт', 'подход'))
);

-- Индексы для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_archive_leads_created_at ON t_p24058207_website_creation_pro.archive_leads_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_archive_leads_user_id ON t_p24058207_website_creation_pro.archive_leads_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_archive_leads_organization_id ON t_p24058207_website_creation_pro.archive_leads_analytics(organization_id);

COMMENT ON TABLE t_p24058207_website_creation_pro.archive_leads_analytics IS 'Архивные данные по лидам с марта 2025';
