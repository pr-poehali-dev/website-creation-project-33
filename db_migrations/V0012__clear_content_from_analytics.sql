-- Set notes and has_audio to NULL for all existing records (keep columns but clear data)
UPDATE leads_analytics SET notes = NULL, has_audio = NULL;