-- Добавляем поле is_active к таблице organizations
ALTER TABLE t_p24058207_website_creation_pro.organizations 
ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;

-- Создаем индекс для быстрого поиска активных организаций
CREATE INDEX idx_organizations_is_active ON t_p24058207_website_creation_pro.organizations(is_active);