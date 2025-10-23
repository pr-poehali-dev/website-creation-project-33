ALTER TABLE t_p24058207_website_creation_pro.archive_leads_analytics 
ADD COLUMN IF NOT EXISTS is_excluded BOOLEAN DEFAULT FALSE;

UPDATE t_p24058207_website_creation_pro.archive_leads_analytics
SET is_excluded = TRUE
WHERE id IN (
  5924,
  5925,
  5955,
  5616,
  5617,
  5431
);

COMMENT ON COLUMN t_p24058207_website_creation_pro.archive_leads_analytics.is_excluded IS 'Флаг исключения дубликатов и ошибочных записей (где в Excel было 0)';