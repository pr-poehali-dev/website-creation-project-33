-- Исправление дат смен с учетом UTC→МСК конвертации
-- Смены открытые после 21:00 UTC должны иметь дату следующего дня по МСК

UPDATE t_p24058207_website_creation_pro.shift_videos
SET work_date = work_date + INTERVAL '1 day'
WHERE EXTRACT(HOUR FROM created_at) >= 21;