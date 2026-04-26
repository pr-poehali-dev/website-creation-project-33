UPDATE t_p24058207_website_creation_pro.promoter_schedules
SET schedule_data = schedule_data
    || '{"2026-04-27": {"slot1": false, "slot2": false}}'::jsonb
    || '{"2026-04-28": {"slot1": false, "slot2": false}}'::jsonb
    || '{"2026-04-29": {"slot1": false, "slot2": false}}'::jsonb,
    updated_at = NOW(),
    submitted_at = NULL
WHERE user_id = 3 AND week_start_date = '2026-04-27';