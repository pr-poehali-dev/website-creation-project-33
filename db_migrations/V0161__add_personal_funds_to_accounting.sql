-- Добавляем поля для внесения личных средств
ALTER TABLE t_p24058207_website_creation_pro.accounting_expenses 
ADD COLUMN personal_funds_amount INTEGER DEFAULT 0,
ADD COLUMN personal_funds_by_kms BOOLEAN DEFAULT FALSE,
ADD COLUMN personal_funds_by_kvv BOOLEAN DEFAULT FALSE;