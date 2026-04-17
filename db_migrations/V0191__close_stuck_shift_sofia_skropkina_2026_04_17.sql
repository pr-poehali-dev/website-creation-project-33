UPDATE t_p24058207_website_creation_pro.work_shifts
SET shift_end = NOW(), updated_at = NOW()
WHERE id = 934 AND shift_end IS NULL;