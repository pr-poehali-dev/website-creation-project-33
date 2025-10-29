-- Добавляем смены на основе данных из leads_analytics за период 01.10 - 17.10
-- Время указано в UTC: 13:00 UTC = 16:00 MSK (начало), 17:00 UTC = 20:00 MSK (конец)
INSERT INTO t_p24058207_website_creation_pro.work_shifts (user_id, organization_id, shift_date, shift_start, shift_end)
SELECT DISTINCT 
    user_id, 
    organization_id, 
    created_at::date as shift_date,
    (created_at::date || ' 13:00:00+00')::timestamptz as shift_start,
    (created_at::date || ' 17:00:00+00')::timestamptz as shift_end
FROM t_p24058207_website_creation_pro.leads_analytics la
WHERE created_at::date >= '2025-10-01' 
  AND created_at::date <= '2025-10-17'
  AND is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM t_p24058207_website_creation_pro.work_shifts ws
    WHERE ws.user_id = la.user_id 
      AND ws.organization_id = la.organization_id 
      AND ws.shift_date = la.created_at::date
  );

-- Добавляем фиксированное время начала смены (16:00 по Москве = 13:00 UTC)
INSERT INTO t_p24058207_website_creation_pro.shift_videos (user_id, organization_id, work_date, video_type, created_at)
SELECT DISTINCT 
    user_id,
    organization_id,
    created_at::date as work_date,
    'start' as video_type,
    (created_at::date || ' 13:00:00+00')::timestamptz as created_at
FROM t_p24058207_website_creation_pro.leads_analytics la
WHERE created_at::date >= '2025-10-01' 
  AND created_at::date <= '2025-10-17'
  AND is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM t_p24058207_website_creation_pro.shift_videos sv
    WHERE sv.user_id = la.user_id 
      AND sv.organization_id = la.organization_id 
      AND sv.work_date = la.created_at::date
      AND sv.video_type = 'start'
  );

-- Добавляем фиксированное время окончания смены (20:00 по Москве = 17:00 UTC)
INSERT INTO t_p24058207_website_creation_pro.shift_videos (user_id, organization_id, work_date, video_type, created_at)
SELECT DISTINCT 
    user_id,
    organization_id,
    created_at::date as work_date,
    'end' as video_type,
    (created_at::date || ' 17:00:00+00')::timestamptz as created_at
FROM t_p24058207_website_creation_pro.leads_analytics la
WHERE created_at::date >= '2025-10-01' 
  AND created_at::date <= '2025-10-17'
  AND is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM t_p24058207_website_creation_pro.shift_videos sv
    WHERE sv.user_id = la.user_id 
      AND sv.organization_id = la.organization_id 
      AND sv.work_date = la.created_at::date
      AND sv.video_type = 'end'
  );
