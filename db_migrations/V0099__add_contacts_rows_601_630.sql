-- Добавляем строки 601-630 из эталонной таблицы (последние)

WITH target_counts AS (
  SELECT '2025-10-11'::date as date, 'ТОП Тушинская' as org, 'Владислава Долматова' as promoter, 8 as count
  UNION ALL SELECT '2025-10-11'::date, 'КиберВан Деловой Центр', 'Кристина Маркаускайте', 8
  UNION ALL SELECT '2025-10-12'::date, 'Сотка', 'Владислава Долматова', 10
  UNION ALL SELECT '2025-10-14'::date, 'ТОП Коломенская', 'Ольга Салтыкова', 11
  UNION ALL SELECT '2025-10-14'::date, 'ТОП Коломенская', 'Владислава Долматова', 1
  UNION ALL SELECT '2025-10-15'::date, 'ТОП Речной', 'Владислава Долматова', 3
  UNION ALL SELECT '2025-10-15'::date, 'ТОП Речной', 'Кристина Маркаускайте', 1
  UNION ALL SELECT '2025-10-16'::date, 'Сотка', 'Александр Тресцов', 10
  UNION ALL SELECT '2025-10-16'::date, 'Сотка', 'Даниил Слепченко', 12
  UNION ALL SELECT '2025-10-17'::date, 'Сотка', 'Даниил Слепченко', 10
  UNION ALL SELECT '2025-10-17'::date, 'Сотка', 'Дарья Никиткова', 11
  UNION ALL SELECT '2025-10-18'::date, 'КиберВан Деловой Центр', 'Кристина Маркаускайте', 11
  UNION ALL SELECT '2025-10-18'::date, 'Сотка', 'Александр Тресцов', 15
  UNION ALL SELECT '2025-10-19'::date, 'Сотка', 'Даниил Слепченко', 21
  UNION ALL SELECT '2025-10-19'::date, 'Сотка', 'Александр Тресцов', 10
  UNION ALL SELECT '2025-10-20'::date, 'ТОП Коломенская', 'Ольга Салтыкова', 12
  UNION ALL SELECT '2025-10-20'::date, 'Сотка', 'Кристина Маркаускайте', 14
  UNION ALL SELECT '2025-10-20'::date, 'Сотка', 'Владислава Долматова', 5
  UNION ALL SELECT '2025-10-20'::date, 'Сотка', 'Дарья Никиткова', 4
  UNION ALL SELECT '2025-10-20'::date, 'Сотка', 'Анастасия Войнова', 3
  UNION ALL SELECT '2025-10-20'::date, 'Сотка', 'Даниил Слепченко', 1
  UNION ALL SELECT '2025-10-21'::date, 'КиберВан Деловой Центр', 'Мирослава Локтева', 3
  UNION ALL SELECT '2025-10-21'::date, 'Сотка', 'Даниил Слепченко', 5
  UNION ALL SELECT '2025-10-21'::date, 'Сотка', 'Владислава Долматова', 5
  UNION ALL SELECT '2025-10-22'::date, 'Сотка', 'Кристина Маркаускайте', 6
  UNION ALL SELECT '2025-10-23'::date, 'ТОП Беляево', 'Владислава Долматова', 1
  UNION ALL SELECT '2025-10-23'::date, 'ТОП Беляево', 'Мария Марченкова', 5
  UNION ALL SELECT '2025-10-24'::date, 'ТОП Беляево', 'rroza', 3
),
ranked_leads AS (
  SELECT 
    l.id,
    DATE(l.created_at + interval '3 hours') as lead_date,
    o.name as org_name,
    u.name as promoter_name,
    ROW_NUMBER() OVER (
      PARTITION BY DATE(l.created_at + interval '3 hours'), o.id, u.id 
      ORDER BY l.id ASC
    ) as rn
  FROM t_p24058207_website_creation_pro.leads_analytics l
  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
  WHERE l.lead_type = 'контакт'
    AND l.created_at >= '2025-03-14'
    AND l.created_at < '2025-10-25'
),
matched AS (
  SELECT rl.id
  FROM ranked_leads rl
  JOIN target_counts tc ON 
    rl.lead_date = tc.date AND
    (rl.org_name = tc.org OR 
     rl.org_name ILIKE tc.org OR
     tc.org ILIKE rl.org_name) AND
    rl.promoter_name = tc.promoter AND
    rl.rn <= tc.count
)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = true
WHERE id IN (SELECT id FROM matched);