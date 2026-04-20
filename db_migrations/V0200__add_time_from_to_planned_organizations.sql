ALTER TABLE t_p24058207_website_creation_pro.planned_organizations
  ADD COLUMN IF NOT EXISTS time_from character varying(5) NULL,
  ADD COLUMN IF NOT EXISTS time_to character varying(5) NULL;