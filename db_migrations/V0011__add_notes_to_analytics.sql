-- Add notes field to leads_analytics for storing lead text and audio flag
ALTER TABLE leads_analytics ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE leads_analytics ADD COLUMN IF NOT EXISTS has_audio BOOLEAN DEFAULT false;