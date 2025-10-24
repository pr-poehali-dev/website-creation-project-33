-- Переносим все данные из archive_leads_analytics в leads_analytics
-- Разворачиваем contact_count в отдельные записи

INSERT INTO t_p24058207_website_creation_pro.leads_analytics 
  (user_id, organization_id, lead_type, lead_result, created_at, notes, is_active)
SELECT 
  a.user_id,
  a.organization_id,
  a.lead_type,
  'положительный' as lead_result,
  a.created_at + (s.n || ' seconds')::interval as created_at,
  COALESCE(a.notes, '') as notes,
  true as is_active
FROM t_p24058207_website_creation_pro.archive_leads_analytics a
CROSS JOIN generate_series(0, GREATEST(a.contact_count - 1, 0)) as s(n)
WHERE (a.is_excluded = FALSE OR a.is_excluded IS NULL)
ORDER BY a.created_at, a.id;