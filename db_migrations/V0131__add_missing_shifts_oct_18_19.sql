-- Добавляем недостающие смены за 18-19 октября
-- Время: 16:00-20:00 МСК (13:00-17:00 UTC)

-- 18.10: user_id=8, org=2
INSERT INTO t_p24058207_website_creation_pro.work_shifts (user_id, organization_id, shift_date, shift_start, shift_end)
VALUES (8, 2, '2025-10-18', '2025-10-18 13:00:00+00', '2025-10-18 17:00:00+00');

INSERT INTO t_p24058207_website_creation_pro.shift_videos (user_id, organization_id, work_date, video_type, created_at)
VALUES (8, 2, '2025-10-18', 'start', '2025-10-18 13:00:00+00');

INSERT INTO t_p24058207_website_creation_pro.shift_videos (user_id, organization_id, work_date, video_type, created_at)
VALUES (8, 2, '2025-10-18', 'end', '2025-10-18 17:00:00+00');

-- 18.10: user_id=40, org=1
INSERT INTO t_p24058207_website_creation_pro.work_shifts (user_id, organization_id, shift_date, shift_start, shift_end)
VALUES (40, 1, '2025-10-18', '2025-10-18 13:00:00+00', '2025-10-18 17:00:00+00');

INSERT INTO t_p24058207_website_creation_pro.shift_videos (user_id, organization_id, work_date, video_type, created_at)
VALUES (40, 1, '2025-10-18', 'start', '2025-10-18 13:00:00+00');

INSERT INTO t_p24058207_website_creation_pro.shift_videos (user_id, organization_id, work_date, video_type, created_at)
VALUES (40, 1, '2025-10-18', 'end', '2025-10-18 17:00:00+00');

-- 19.10: user_id=43, org=1
INSERT INTO t_p24058207_website_creation_pro.work_shifts (user_id, organization_id, shift_date, shift_start, shift_end)
VALUES (43, 1, '2025-10-19', '2025-10-19 13:00:00+00', '2025-10-19 17:00:00+00');

INSERT INTO t_p24058207_website_creation_pro.shift_videos (user_id, organization_id, work_date, video_type, created_at)
VALUES (43, 1, '2025-10-19', 'start', '2025-10-19 13:00:00+00');

INSERT INTO t_p24058207_website_creation_pro.shift_videos (user_id, organization_id, work_date, video_type, created_at)
VALUES (43, 1, '2025-10-19', 'end', '2025-10-19 17:00:00+00');
