-- Шаг 1: переименовываем 11:00-15:00 во временный ключ
UPDATE t_p24058207_website_creation_pro.work_location_comments
SET shift_time = '__tmp_slot1__'
WHERE shift_time = '11:00-15:00';

-- Шаг 2: переименовываем 15:00-19:00 во временный ключ
UPDATE t_p24058207_website_creation_pro.work_location_comments
SET shift_time = '__tmp_slot2__'
WHERE shift_time = '15:00-19:00';

-- Шаг 3: для __tmp_slot1__ где уже есть 12:00-16:00 — перезаписываем данные в существующую запись
UPDATE t_p24058207_website_creation_pro.work_location_comments AS target
SET organization = src.organization,
    location_type = src.location_type,
    location_details = src.location_details,
    flyers_comment = src.flyers_comment,
    location_comment = src.location_comment,
    updated_at = CURRENT_TIMESTAMP
FROM t_p24058207_website_creation_pro.work_location_comments AS src
WHERE target.user_name = src.user_name
  AND target.work_date = src.work_date
  AND target.shift_time = '12:00-16:00'
  AND src.shift_time = '__tmp_slot1__'
  AND (src.organization != '' OR src.location_details != '');

-- Шаг 4: __tmp_slot1__ где нет конфликта — переименовываем в 12:00-16:00
UPDATE t_p24058207_website_creation_pro.work_location_comments
SET shift_time = '12:00-16:00'
WHERE shift_time = '__tmp_slot1__'
  AND (user_name, work_date) NOT IN (
    SELECT user_name, work_date
    FROM t_p24058207_website_creation_pro.work_location_comments
    WHERE shift_time = '12:00-16:00'
  );

-- Шаг 5: оставшиеся __tmp_slot1__ (где конфликт) — обнуляем данные
UPDATE t_p24058207_website_creation_pro.work_location_comments
SET organization = '', location_type = '', location_details = '', flyers_comment = '', location_comment = '', shift_time = '__done_slot1__'
WHERE shift_time = '__tmp_slot1__';

-- Шаг 6: __tmp_slot2__ -> 16:00-20:00
UPDATE t_p24058207_website_creation_pro.work_location_comments
SET shift_time = '16:00-20:00'
WHERE shift_time = '__tmp_slot2__'
  AND (user_name, work_date) NOT IN (
    SELECT user_name, work_date
    FROM t_p24058207_website_creation_pro.work_location_comments
    WHERE shift_time = '16:00-20:00'
  );