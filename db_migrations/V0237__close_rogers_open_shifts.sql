UPDATE t_p24058207_website_creation_pro.work_shifts
SET shift_end = shift_start + interval '8 hours'
WHERE user_id = 6869 AND shift_end IS NULL;