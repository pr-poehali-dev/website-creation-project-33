-- Деактивируем все дубликаты, оставляя по одной записи на каждую комбинацию (дата, организация, промоутер)
WITH ranked AS (
  SELECT 
    l.id,
    ROW_NUMBER() OVER (
      PARTITION BY DATE(l.created_at + interval '3 hours'), l.organization_id, l.user_id 
      ORDER BY l.id ASC
    ) as rn
  FROM t_p24058207_website_creation_pro.leads_analytics l
  WHERE l.is_active = true 
    AND l.lead_type = 'контакт'
    AND l.created_at >= '2025-03-14'
    AND l.created_at < '2025-10-25'
)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);