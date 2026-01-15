-- Add approaches column to leads table to track cancel button clicks
ALTER TABLE t_p24058207_website_creation_pro.leads 
ADD COLUMN approaches INTEGER NOT NULL DEFAULT 0;