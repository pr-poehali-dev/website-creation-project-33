-- Добавляем колонку organization_id в таблицу leads_analytics
ALTER TABLE t_p24058207_website_creation_pro.leads_analytics 
ADD COLUMN IF NOT EXISTS organization_id INTEGER;

-- Добавляем внешний ключ к таблице organizations  
ALTER TABLE t_p24058207_website_creation_pro.leads_analytics 
ADD CONSTRAINT fk_leads_organization 
FOREIGN KEY (organization_id) 
REFERENCES t_p24058207_website_creation_pro.organizations(id);