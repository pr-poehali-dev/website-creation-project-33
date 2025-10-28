-- Add contact_rate column to organizations table
ALTER TABLE t_p24058207_website_creation_pro.organizations 
ADD COLUMN contact_rate INTEGER DEFAULT 0;

COMMENT ON COLUMN t_p24058207_website_creation_pro.organizations.contact_rate IS 'Ставка за один контакт в рублях';