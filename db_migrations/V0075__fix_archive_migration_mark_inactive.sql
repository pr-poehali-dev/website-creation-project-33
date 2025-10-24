-- Помечаем все неправильно перенесённые записи как неактивные
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET is_active = false 
WHERE created_at < '2025-10-01'::date AND user_id = 1;

-- Создаём недостающих пользователей из архива
INSERT INTO t_p24058207_website_creation_pro.users (email, name, password_hash, is_admin, is_active, is_approved)
SELECT 
  LOWER(REPLACE(TRIM(promoter_name), ' ', '.')) || '@archive.local' as email,
  TRIM(promoter_name) as name,
  'archived_user' as password_hash,
  false as is_admin,
  true as is_active,
  true as is_approved
FROM (
  SELECT DISTINCT promoter_name
  FROM t_p24058207_website_creation_pro.archive_leads_analytics
  WHERE (is_excluded = FALSE OR is_excluded IS NULL) 
    AND promoter_name IS NOT NULL
    AND TRIM(promoter_name) != ''
    AND TRIM(promoter_name) NOT IN (
      SELECT name FROM t_p24058207_website_creation_pro.users WHERE is_active = TRUE
    )
) archived_promoters
ON CONFLICT (email) DO NOTHING;

-- Переносим данные с правильным сопоставлением промоутеров
INSERT INTO t_p24058207_website_creation_pro.leads_analytics 
  (user_id, organization_id, lead_type, lead_result, created_at, notes, is_active)
SELECT 
  u.id as user_id,
  a.organization_id,
  a.lead_type,
  'положительный' as lead_result,
  a.created_at + (s.n || ' seconds')::interval as created_at,
  COALESCE(a.notes, '') as notes,
  true as is_active
FROM t_p24058207_website_creation_pro.archive_leads_analytics a
CROSS JOIN generate_series(0, GREATEST(a.contact_count - 1, 0)) as s(n)
JOIN t_p24058207_website_creation_pro.users u ON TRIM(a.promoter_name) = u.name
WHERE (a.is_excluded = FALSE OR a.is_excluded IS NULL)
  AND a.promoter_name IS NOT NULL
  AND TRIM(a.promoter_name) != ''
ORDER BY a.created_at, a.id;