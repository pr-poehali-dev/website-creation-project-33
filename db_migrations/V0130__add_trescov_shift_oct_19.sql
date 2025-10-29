-- Добавляем смену Тресцова в Сотке за 19.10.2025
-- Время: 16:00-20:00 МСК (13:00-17:00 UTC)
INSERT INTO t_p24058207_website_creation_pro.work_shifts (user_id, organization_id, shift_date, shift_start, shift_end)
VALUES (40, 1, '2025-10-19', '2025-10-19 13:00:00+00', '2025-10-19 17:00:00+00');

-- Добавляем видео начала смены
INSERT INTO t_p24058207_website_creation_pro.shift_videos (user_id, organization_id, work_date, video_type, created_at)
VALUES (40, 1, '2025-10-19', 'start', '2025-10-19 13:00:00+00');

-- Добавляем видео окончания смены
INSERT INTO t_p24058207_website_creation_pro.shift_videos (user_id, organization_id, work_date, video_type, created_at)
VALUES (40, 1, '2025-10-19', 'end', '2025-10-19 17:00:00+00');
