-- Исправляем дубликаты в октябре: деактивируем лишние записи

-- 16.10 | Сотка | Даниил Слепченко: оставить 12 из 24
WITH ranked AS (
  SELECT l.id, ROW_NUMBER() OVER (ORDER BY l.id ASC) as rn
  FROM t_p24058207_website_creation_pro.leads_analytics l
  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
  WHERE l.is_active = true 
    AND l.lead_type = 'контакт'
    AND DATE(l.created_at + interval '3 hours') = '2025-10-16'
    AND o.name = 'Сотка'
    AND u.name = 'Даниил Слепченко'
)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 12);

-- 17.10 | Сотка | Даниил Слепченко: оставить 10 из 20
WITH ranked AS (
  SELECT l.id, ROW_NUMBER() OVER (ORDER BY l.id ASC) as rn
  FROM t_p24058207_website_creation_pro.leads_analytics l
  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
  WHERE l.is_active = true 
    AND l.lead_type = 'контакт'
    AND DATE(l.created_at + interval '3 hours') = '2025-10-17'
    AND o.name = 'Сотка'
    AND u.name = 'Даниил Слепченко'
)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 10);

-- 19.10 | Сотка | Даниил Слепченко: оставить 21 из 42
WITH ranked AS (
  SELECT l.id, ROW_NUMBER() OVER (ORDER BY l.id ASC) as rn
  FROM t_p24058207_website_creation_pro.leads_analytics l
  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
  WHERE l.is_active = true 
    AND l.lead_type = 'контакт'
    AND DATE(l.created_at + interval '3 hours') = '2025-10-19'
    AND o.name = 'Сотка'
    AND u.name = 'Даниил Слепченко'
)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 21);

-- 20.10 | Сотка | Анастасия Войнова: оставить 3 из 6
WITH ranked AS (
  SELECT l.id, ROW_NUMBER() OVER (ORDER BY l.id ASC) as rn
  FROM t_p24058207_website_creation_pro.leads_analytics l
  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
  WHERE l.is_active = true 
    AND l.lead_type = 'контакт'
    AND DATE(l.created_at + interval '3 hours') = '2025-10-20'
    AND o.name = 'Сотка'
    AND u.name = 'Анастасия Войнова'
)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 3);

-- 20.10 | Сотка | Даниил Слепченко: оставить 1 из 2
WITH ranked AS (
  SELECT l.id, ROW_NUMBER() OVER (ORDER BY l.id ASC) as rn
  FROM t_p24058207_website_creation_pro.leads_analytics l
  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
  WHERE l.is_active = true 
    AND l.lead_type = 'контакт'
    AND DATE(l.created_at + interval '3 hours') = '2025-10-20'
    AND o.name = 'Сотка'
    AND u.name = 'Даниил Слепченко'
)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- 21.10 | КиберВан Деловой Центр | Мирослава Локтева: оставить 3 из 6
WITH ranked AS (
  SELECT l.id, ROW_NUMBER() OVER (ORDER BY l.id ASC) as rn
  FROM t_p24058207_website_creation_pro.leads_analytics l
  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
  WHERE l.is_active = true 
    AND l.lead_type = 'контакт'
    AND DATE(l.created_at + interval '3 hours') = '2025-10-21'
    AND o.name = 'КиберВан Деловой Центр'
    AND u.name = 'Мирослава Локтева'
)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 3);

-- 21.10 | Сотка | Даниил Слепченко: оставить 5 из 10
WITH ranked AS (
  SELECT l.id, ROW_NUMBER() OVER (ORDER BY l.id ASC) as rn
  FROM t_p24058207_website_creation_pro.leads_analytics l
  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
  WHERE l.is_active = true 
    AND l.lead_type = 'контакт'
    AND DATE(l.created_at + interval '3 hours') = '2025-10-21'
    AND o.name = 'Сотка'
    AND u.name = 'Даниил Слепченко'
)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 5);

-- 04.10 | Сотка | Артём Сушко: оставить 2 из 4
WITH ranked AS (
  SELECT l.id, ROW_NUMBER() OVER (ORDER BY l.id ASC) as rn
  FROM t_p24058207_website_creation_pro.leads_analytics l
  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
  WHERE l.is_active = true 
    AND l.lead_type = 'контакт'
    AND DATE(l.created_at + interval '3 hours') = '2025-10-04'
    AND o.name = 'Сотка'
    AND u.name = 'Артём Сушко'
)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 2);

-- 24.10 | ТОП Беляево | rroza: оставить 3 из 6
WITH ranked AS (
  SELECT l.id, ROW_NUMBER() OVER (ORDER BY l.id ASC) as rn
  FROM t_p24058207_website_creation_pro.leads_analytics l
  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
  WHERE l.is_active = true 
    AND l.lead_type = 'контакт'
    AND DATE(l.created_at + interval '3 hours') = '2025-10-24'
    AND o.name = 'ТОП Беляево'
    AND u.name = 'rroza'
)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (SELECT id FROM ranked WHERE rn > 3);