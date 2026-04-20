-- Добавляем поля промоутера в planned_organizations
ALTER TABLE t_p24058207_website_creation_pro.planned_organizations
  ADD COLUMN IF NOT EXISTS promoter_id INTEGER NULL REFERENCES t_p24058207_website_creation_pro.users(id),
  ADD COLUMN IF NOT EXISTS promoter_org_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS promoter_place_type VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS promoter_address TEXT NULL,
  ADD COLUMN IF NOT EXISTS promoter_leaflets INTEGER NULL;
