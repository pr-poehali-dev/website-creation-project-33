CREATE TABLE t_p24058207_website_creation_pro.planned_organizations (
  id SERIAL PRIMARY KEY,
  organization_id INTEGER NOT NULL REFERENCES t_p24058207_website_creation_pro.organizations(id),
  date DATE NOT NULL,
  senior_id INTEGER REFERENCES t_p24058207_website_creation_pro.users(id),
  color VARCHAR(20) NOT NULL DEFAULT '#3b82f6',
  contact_limit INTEGER NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);