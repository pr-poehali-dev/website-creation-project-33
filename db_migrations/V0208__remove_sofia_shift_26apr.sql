UPDATE promoter_schedules
SET schedule_data = jsonb_set(schedule_data, '{2026-04-26}', '{"slot1": false, "slot2": false}')
WHERE id = 533;