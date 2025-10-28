-- Добавляем смены с 27.10
INSERT INTO t_p24058207_website_creation_pro.work_shifts (user_id, organization_id, shift_date, shift_start, shift_end)
VALUES 
    (7, 2, '2025-10-27', '2025-10-27 12:00:00+03', '2025-10-27 18:00:00+03'),
    (6806, 6, '2025-10-27', '2025-10-27 12:00:00+03', '2025-10-27 18:00:00+03'),
    (7, 2, '2025-10-28', '2025-10-28 12:00:00+03', '2025-10-28 18:00:00+03')
ON CONFLICT DO NOTHING;