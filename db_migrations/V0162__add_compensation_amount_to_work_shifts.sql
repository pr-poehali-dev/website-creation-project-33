-- Добавляем поле compensation_amount для корректировки суммы прихода
ALTER TABLE work_shifts 
ADD COLUMN IF NOT EXISTS compensation_amount INTEGER DEFAULT 0;