-- Reset approaches for January 15, 2026 to zero
UPDATE t_p24058207_website_creation_pro.leads 
SET approaches = 0 
WHERE id IN (68, 69, 70);