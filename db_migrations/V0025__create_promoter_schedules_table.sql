-- Create table for promoter work schedules
CREATE TABLE IF NOT EXISTS promoter_schedules (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    week_start_date DATE NOT NULL,
    schedule_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, week_start_date)
);

-- Create index for faster queries
CREATE INDEX idx_promoter_schedules_user_id ON promoter_schedules(user_id);
CREATE INDEX idx_promoter_schedules_week_start ON promoter_schedules(week_start_date);

-- Add comment
COMMENT ON TABLE promoter_schedules IS 'Weekly work schedules for promoters with time slots';
COMMENT ON COLUMN promoter_schedules.schedule_data IS 'JSON object with daily time slots: {date: {slot1: boolean, slot2: boolean}}';