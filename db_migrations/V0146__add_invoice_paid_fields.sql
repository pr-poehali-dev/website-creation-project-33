-- Добавление новых полей для счетов в таблицу accounting_expenses
ALTER TABLE t_p24058207_website_creation_pro.accounting_expenses 
ADD COLUMN IF NOT EXISTS invoice_issued_date DATE,
ADD COLUMN IF NOT EXISTS invoice_paid BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS invoice_paid_date DATE;