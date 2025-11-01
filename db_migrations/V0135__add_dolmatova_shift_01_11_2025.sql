-- Добавить запись в work_shifts для смены Долматовой 01.11.2025
INSERT INTO work_shifts (user_id, organization_id, shift_date, shift_start, shift_end)
VALUES (7, 1, '2025-11-01', '2025-11-01 13:00:00+00'::timestamptz, '2025-11-01 20:00:00+00'::timestamptz)
ON CONFLICT (user_id, organization_id, shift_date) 
DO UPDATE SET 
    shift_start = EXCLUDED.shift_start,
    shift_end = EXCLUDED.shift_end;