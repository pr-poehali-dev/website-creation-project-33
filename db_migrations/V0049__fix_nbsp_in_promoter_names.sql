-- Fix non-breaking spaces in promoter names (replace nbsp with regular space)
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics
SET promoter_name = REPLACE(promoter_name, CHR(160), ' ')
WHERE promoter_name LIKE '%' || CHR(160) || '%';