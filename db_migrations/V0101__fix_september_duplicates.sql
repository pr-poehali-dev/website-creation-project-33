-- Исправляем дубликаты в сентябре: деактивируем лишние записи

-- 24.09 | Юниум Люблино | Ольга Алексеева: оставить 1 из 2
WITH ranked AS (
  SELECT l.id, ROW_NUMBER() OVER (ORDER BY l.id ASC) as rn
  FROM t_p24058207_website_creation_pro.leads_analytics l
  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
  WHERE l.is_active = true 
    AND l.lead_type = 'контакт'
    AND DATE(l.created_at + interval '3 hours') = '2025-09-24'
    AND o.name = 'Юниум Люблино'
    AND u.name = 'Ольга Алексеева'
)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 25.09 | Юниум Люблино | Ольга Алексеева: оставить 7 из 14
WITH ranked AS (
  SELECT l.id, ROW_NUMBER() OVER (ORDER BY l.id ASC) as rn
  FROM t_p24058207_website_creation_pro.leads_analytics l
  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
  WHERE l.is_active = true 
    AND l.lead_type = 'контакт'
    AND DATE(l.created_at + interval '3 hours') = '2025-09-25'
    AND o.name = 'Юниум Люблино'
    AND u.name = 'Ольга Алексеева'
)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 7);

-- 26.09 | ТОП Беляево | Ольга Алексеева: оставить 7 из 14
WITH ranked AS (
  SELECT l.id, ROW_NUMBER() OVER (ORDER BY l.id ASC) as rn
  FROM t_p24058207_website_creation_pro.leads_analytics l
  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
  WHERE l.is_active = true 
    AND l.lead_type = 'контакт'
    AND DATE(l.created_at + interval '3 hours') = '2025-09-26'
    AND o.name = 'ТОП Беляево'
    AND u.name = 'Ольга Алексеева'
)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 7);

-- 30.09 | ТОП Речной | Ольга Алексеева: оставить 4 из 8
WITH ranked AS (
  SELECT l.id, ROW_NUMBER() OVER (ORDER BY l.id ASC) as rn
  FROM t_p24058207_website_creation_pro.leads_analytics l
  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
  WHERE l.is_active = true 
    AND l.lead_type = 'контакт'
    AND DATE(l.created_at + interval '3 hours') = '2025-09-30'
    AND o.name = 'ТОП Речной'
    AND u.name = 'Ольга Алексеева'
)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 4);

-- 01.10 | ТОП Речной | Ольга Алексеева: оставить 9 из 18
WITH ranked AS (
  SELECT l.id, ROW_NUMBER() OVER (ORDER BY l.id ASC) as rn
  FROM t_p24058207_website_creation_pro.leads_analytics l
  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
  WHERE l.is_active = true 
    AND l.lead_type = 'контакт'
    AND DATE(l.created_at + interval '3 hours') = '2025-10-01'
    AND o.name = 'ТОП Речной'
    AND u.name = 'Ольга Алексеева'
)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 9);