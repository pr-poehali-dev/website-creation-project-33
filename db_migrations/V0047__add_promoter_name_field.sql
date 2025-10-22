-- Add promoter_name field to store promoter name for imported archive data
ALTER TABLE t_p24058207_website_creation_pro.archive_leads_analytics 
ADD COLUMN promoter_name VARCHAR(255);

COMMENT ON COLUMN t_p24058207_website_creation_pro.archive_leads_analytics.promoter_name 
IS 'Name of the promoter for imported archive data (alternative to user_id for historical imports)';
