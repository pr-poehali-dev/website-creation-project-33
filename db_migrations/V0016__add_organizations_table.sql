-- Создаем таблицу организаций
CREATE TABLE IF NOT EXISTS organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Добавляем поле organization_id в таблицу leads
ALTER TABLE leads 
ADD COLUMN IF NOT EXISTS organization_id INTEGER REFERENCES organizations(id);

-- Создаем индекс для быстрого поиска по организации
CREATE INDEX IF NOT EXISTS idx_leads_organization_id ON leads(organization_id);