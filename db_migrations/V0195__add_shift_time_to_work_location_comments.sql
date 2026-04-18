-- Добавляем поле shift_time в work_location_comments
ALTER TABLE work_location_comments ADD COLUMN IF NOT EXISTS shift_time VARCHAR(20);

-- Удаляем старый уникальный constraint
ALTER TABLE work_location_comments DROP CONSTRAINT IF EXISTS work_location_comments_user_name_work_date_key;

-- Добавляем новый уникальный constraint с учётом смены
ALTER TABLE work_location_comments ADD CONSTRAINT work_location_comments_user_date_shift_key UNIQUE (user_name, work_date, shift_time);

-- Обновляем индекс
DROP INDEX IF EXISTS idx_work_location_user_date;
CREATE INDEX idx_work_location_user_date_shift ON work_location_comments(user_name, work_date, shift_time);
