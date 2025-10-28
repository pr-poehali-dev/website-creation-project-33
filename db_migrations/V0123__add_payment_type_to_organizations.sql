-- Add payment_type column to organizations table
ALTER TABLE t_p24058207_website_creation_pro.organizations 
ADD COLUMN payment_type VARCHAR(20) DEFAULT 'cash';

COMMENT ON COLUMN t_p24058207_website_creation_pro.organizations.payment_type IS 'Форма оплаты: cash (наличный) или cashless (безналичный)';