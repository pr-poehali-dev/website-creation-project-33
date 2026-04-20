ALTER TABLE t_p24058207_website_creation_pro.planned_organizations
  ADD COLUMN IF NOT EXISTS senior_ts_id integer NULL
  REFERENCES t_p24058207_website_creation_pro.training_seniors(id);