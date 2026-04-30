UPDATE t_p24058207_website_creation_pro.work_shifts
SET shift_end = shift_start + interval '1 minute',
    updated_at = now()
WHERE shift_end IS NULL;