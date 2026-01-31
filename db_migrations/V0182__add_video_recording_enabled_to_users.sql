-- Add video recording enabled flag for promoters
ALTER TABLE users ADD COLUMN IF NOT EXISTS video_recording_enabled BOOLEAN DEFAULT false;