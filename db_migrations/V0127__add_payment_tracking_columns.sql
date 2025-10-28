-- Добавляем столбцы для отслеживания оплат
ALTER TABLE t_p24058207_website_creation_pro.accounting_expenses
ADD COLUMN IF NOT EXISTS paid_by_organization BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS paid_to_worker BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS paid_kvv BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS paid_kms BOOLEAN DEFAULT false;