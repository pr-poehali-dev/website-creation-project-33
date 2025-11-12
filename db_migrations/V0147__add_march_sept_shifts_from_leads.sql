
-- Создание смен для периода март-сентябрь 2025 на основе лидов
-- Группируем лиды по дате, пользователю и организации и создаем записи в work_shifts

INSERT INTO t_p24058207_website_creation_pro.work_shifts 
    (user_id, shift_date, organization_id, shift_start, shift_end, created_at, updated_at)
SELECT DISTINCT
    l.user_id,
    (l.created_at + INTERVAL '3 hours')::date as shift_date,
    l.organization_id,
    MIN(l.created_at) as shift_start,
    MAX(l.created_at) as shift_end,
    MIN(l.created_at) as created_at,
    NOW() as updated_at
FROM t_p24058207_website_creation_pro.leads_analytics l
WHERE l.is_active = true
    AND l.created_at >= '2025-03-01 00:00:00+00:00'
    AND l.created_at < '2025-10-01 00:00:00+00:00'
    AND l.organization_id IS NOT NULL
    AND NOT EXISTS (
        SELECT 1 FROM t_p24058207_website_creation_pro.work_shifts ws
        WHERE ws.user_id = l.user_id 
            AND ws.shift_date = (l.created_at + INTERVAL '3 hours')::date
            AND ws.organization_id = l.organization_id
    )
GROUP BY l.user_id, (l.created_at + INTERVAL '3 hours')::date, l.organization_id
ORDER BY shift_date DESC;
