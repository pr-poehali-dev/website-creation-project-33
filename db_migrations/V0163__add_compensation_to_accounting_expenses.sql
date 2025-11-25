-- Добавляем поле compensation_amount в accounting_expenses для корректировки суммы прихода
ALTER TABLE accounting_expenses 
ADD COLUMN IF NOT EXISTS compensation_amount INTEGER DEFAULT 0;