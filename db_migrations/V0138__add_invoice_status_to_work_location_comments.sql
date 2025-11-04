-- Add invoice_issued column to track if invoice has been issued
ALTER TABLE t_p24058207_website_creation_pro.work_location_comments 
ADD COLUMN invoice_issued BOOLEAN DEFAULT FALSE;