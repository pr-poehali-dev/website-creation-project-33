-- Добавляем недостающую запись смены для Эрмека Исаева на 08.11.2025
INSERT INTO t_p24058207_website_creation_pro.work_shifts 
(user_id, organization_id, shift_date, shift_start, shift_end, created_at, updated_at)
VALUES 
(6836, 17, '2025-11-08', '2025-11-08T11:58:40.697545+00:00'::timestamptz, '2025-11-08T15:27:59.789059+00:00'::timestamptz, now(), now())
ON CONFLICT (user_id, organization_id, shift_date) DO NOTHING;