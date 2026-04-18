UPDATE t_p24058207_website_creation_pro.promoter_schedules
SET submitted_at = NULL
WHERE user_id = 3
AND week_start_date = '2026-04-13'
AND NOT EXISTS (
    SELECT 1
    FROM jsonb_each(schedule_data) AS days(day_key, day_val),
         jsonb_each(day_val) AS slots(slot_key, slot_val)
    WHERE slot_val::boolean = true
);