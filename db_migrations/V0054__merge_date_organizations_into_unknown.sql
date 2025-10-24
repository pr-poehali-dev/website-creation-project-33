-- Create "Неизвестная организация" if not exists
INSERT INTO t_p24058207_website_creation_pro.organizations (name, created_at)
VALUES ('Неизвестная организация', NOW())
ON CONFLICT DO NOTHING;

-- Update all records from date-based organizations to "Неизвестная организация"
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'Неизвестная организация')
WHERE organization_id IN (80, 81, 82, 83, 84, 85, 86, 87);