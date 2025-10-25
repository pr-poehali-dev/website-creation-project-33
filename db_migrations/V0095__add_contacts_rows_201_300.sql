-- Добавляем строки 201-300 из эталонной таблицы

WITH target_counts AS (
  SELECT '2025-07-03'::date as date, 'ТОП Академическая' as org, 'Александра' as promoter, 6 as count
  UNION ALL SELECT '2025-07-03'::date, 'ТОП Академическая', 'Мария 5808', 4
  UNION ALL SELECT '2025-07-03'::date, 'ТОП Академическая', 'Вероника Тарасова', 2
  UNION ALL SELECT '2025-07-03'::date, 'ТОП Академическая', 'Денис', 1
  UNION ALL SELECT '2025-07-03'::date, 'ТОП Шаболовская', 'Злата', 6
  UNION ALL SELECT '2025-07-03'::date, 'ТОП Шаболовская', 'Ангелина', 1
  UNION ALL SELECT '2025-07-04'::date, 'ТОП Речной', 'Виктория', 3
  UNION ALL SELECT '2025-07-04'::date, 'ТОП Речной', 'Аделина', 7
  UNION ALL SELECT '2025-07-04'::date, 'ТОП Речной', 'Сергей', 7
  UNION ALL SELECT '2025-07-04'::date, 'ТОП Речной', 'Екатерина', 6
  UNION ALL SELECT '2025-07-04'::date, 'ТОП Речной', 'Мария 5808', 7
  UNION ALL SELECT '2025-07-04'::date, 'ТОП Речной', 'Елизавета', 5
  UNION ALL SELECT '2025-07-04'::date, 'ТОП Речной', 'Александра', 3
  UNION ALL SELECT '2025-07-05'::date, 'ТОП Реутов', 'Виктория', 22
  UNION ALL SELECT '2025-07-05'::date, 'ТОП Реутов', 'Диана Гумерова', 43
  UNION ALL SELECT '2025-07-05'::date, 'Воркаут Царицыно', 'Амир', 7
  UNION ALL SELECT '2025-07-05'::date, 'Воркаут Царицыно', 'Вероника Тарасова', 8
  UNION ALL SELECT '2025-07-05'::date, 'КиберВан Электросталь', 'Сергей', 31
  UNION ALL SELECT '2025-07-05'::date, 'КиберВан Электросталь', 'Денис', 8
  UNION ALL SELECT '2025-07-05'::date, 'КиберВан Электросталь', 'Дарья', 5
  UNION ALL SELECT '2025-07-06'::date, 'ТОП Воскресенск', 'Сергей Арнаут', 15
  UNION ALL SELECT '2025-07-06'::date, 'ТОП Воскресенск', 'Майя Дзюба', 12
  UNION ALL SELECT '2025-07-06'::date, 'ТОП Воскресенск', 'Денис', 4
  UNION ALL SELECT '2025-07-06'::date, 'ТОП Новые Черемушки Школа', 'Дамир', 10
  UNION ALL SELECT '2025-07-06'::date, 'ТОП Новые Черемушки Школа', 'Диана Гумерова', 30
  UNION ALL SELECT '2025-07-06'::date, 'ТОП Шаболовская', 'Диана Гумерова', 3
  UNION ALL SELECT '2025-07-06'::date, 'Воркаут Царицыно', 'Дамир', 6
  UNION ALL SELECT '2025-07-07'::date, 'ТОП Беляево', 'Диана Гумерова', 30
  UNION ALL SELECT '2025-07-07'::date, 'ТОП Шаболовская', 'Ярослав Демкин', 10
  UNION ALL SELECT '2025-07-07'::date, 'ТОП Шаболовская', 'Виктория', 4
  UNION ALL SELECT '2025-07-07'::date, 'ТОП Шаболовская', 'Иван Науменко', 1
  UNION ALL SELECT '2025-07-07'::date, 'ТОП Шаболовская', 'Дамир', 8
  UNION ALL SELECT '2025-07-07'::date, 'ТОП Щелково', 'Филипп Олейник', 14
  UNION ALL SELECT '2025-07-07'::date, 'ТОП Щелково', 'Николь', 2
  UNION ALL SELECT '2025-07-07'::date, 'ТОП Щелково', 'Денис', 4
  UNION ALL SELECT '2025-07-08'::date, 'ТОП Ногинск', 'Филипп Олейник', 12
  UNION ALL SELECT '2025-07-08'::date, 'ТОП Ногинск', 'Денис', 19
  UNION ALL SELECT '2025-07-08'::date, 'ТОП Беляево', 'Диана Гумерова', 20
  UNION ALL SELECT '2025-07-08'::date, 'ТОП Академическая', 'Сергей Арнаут', 7
  UNION ALL SELECT '2025-07-08'::date, 'ТОП Академическая', 'Виктория', 2
  UNION ALL SELECT '2025-07-08'::date, 'ТОП Академическая', 'Вероника Тарасова', 5
  UNION ALL SELECT '2025-07-08'::date, 'ТОП Академическая', 'Дамир', 5
  UNION ALL SELECT '2025-07-08'::date, 'ТОП Академическая', 'Диана Гумерова', 6
  UNION ALL SELECT '2025-07-09'::date, 'ТОП Академическая', 'Дамир', 2
  UNION ALL SELECT '2025-07-09'::date, 'ТОП Речной', 'Диана Гумерова', 30
  UNION ALL SELECT '2025-07-09'::date, 'Балет Волжская', 'Ярослав Демкин', 12
  UNION ALL SELECT '2025-07-09'::date, 'Балет Волжская', 'Иван Попов', 1
  UNION ALL SELECT '2025-07-09'::date, 'Воркаут Царицыно', 'Сергей Арнаут', 11
  UNION ALL SELECT '2025-07-09'::date, 'Воркаут Царицыно', 'Вероника Тарасова', 2
  UNION ALL SELECT '2025-07-09'::date, 'КиберВан Балашиха', 'Элеонора', 12
  UNION ALL SELECT '2025-07-09'::date, 'КиберВан Балашиха', 'Никита', 10
  UNION ALL SELECT '2025-07-09'::date, 'ТОП Академическая', 'Михаил 3545', 5
  UNION ALL SELECT '2025-07-09'::date, 'ТОП Академическая', 'Алексей 2703', 0
  UNION ALL SELECT '2025-07-09'::date, 'ТОП Академическая', 'Дамир', 2
  UNION ALL SELECT '2025-07-09'::date, 'ТОП Академическая', 'Денис', 4
  UNION ALL SELECT '2025-07-10'::date, 'ТОП Перово Академия', 'Александра', 15
  UNION ALL SELECT '2025-07-10'::date, 'КиберВан Балашиха', 'Денис', 10
  UNION ALL SELECT '2025-07-10'::date, 'КиберВан Балашиха', 'Элеонора', 9
  UNION ALL SELECT '2025-07-10'::date, 'КиберВан Балашиха', 'Никита', 14
  UNION ALL SELECT '2025-07-10'::date, 'КиберВан Балашиха', 'Сергей Балашиха (нужна фамилия)', 11
  UNION ALL SELECT '2025-07-10'::date, 'ТОП Домодедовская', 'Диана Гумерова', 13
  UNION ALL SELECT '2025-07-10'::date, 'ТОП Домодедовская', 'Вероника Тарасова', 4
  UNION ALL SELECT '2025-07-12'::date, 'ТОП Щелково', 'Вероника Лапаева', 10
  UNION ALL SELECT '2025-07-11'::date, 'ТОП Перово Академия', 'Диана Гумерова', 16
  UNION ALL SELECT '2025-07-11'::date, 'ТОП Перово Академия', 'Амир', 8
  UNION ALL SELECT '2025-07-11'::date, 'ТОП Перово Академия', 'Майя Дзюба', 3
  UNION ALL SELECT '2025-07-11'::date, 'ТОП Перово Академия', 'Михаил', 2
  UNION ALL SELECT '2025-07-11'::date, 'ТОП Перово Академия', 'Виктория', 2
  UNION ALL SELECT '2025-07-11'::date, 'ТОП Перово Универ', 'Амир', 1
  UNION ALL SELECT '2025-07-11'::date, 'ТОП Перово Универ', 'Виктория', 3
  UNION ALL SELECT '2025-07-14'::date, 'ТОП Щелково', 'Вероника Лапаева', 5
  UNION ALL SELECT '2025-07-14'::date, 'Воркаут Царицыно', 'Ярослав Демкин', 11
  UNION ALL SELECT '2025-07-14'::date, 'Воркаут Царицыно', 'Никита', 9
  UNION ALL SELECT '2025-07-14'::date, 'ТОП Домодедовская', 'Виктория', 4
  UNION ALL SELECT '2025-07-14'::date, 'ТОП Перово Универ', 'Вероника Тарасова', 0
  UNION ALL SELECT '2025-07-14'::date, 'ТОП Перово Универ', 'Элеонора', 0
  UNION ALL SELECT '2025-07-15'::date, 'ТОП Новые Черемушки Школа', 'Диана Гумерова', 10
  UNION ALL SELECT '2025-07-15'::date, 'ТОП Домодедовская', 'Диана Гумерова', 18
  UNION ALL SELECT '2025-07-15'::date, 'ТОП Речной', 'Иван Науменко', 4
  UNION ALL SELECT '2025-07-15'::date, 'ТОП Перово Универ', 'Виктория', 0
  UNION ALL SELECT '2025-07-15'::date, 'ТОП Перово Универ', 'Элеонора', 0
  UNION ALL SELECT '2025-07-15'::date, 'ТОП Перово Универ', 'Никита', 0
  UNION ALL SELECT '2025-07-16'::date, 'Воркаут Царицыно', 'Диана Гумерова', 10
  UNION ALL SELECT '2025-07-16'::date, 'ТОП Домодедовская', 'Диана Гумерова', 22
  UNION ALL SELECT '2025-07-16'::date, 'ТОП Беляево', 'Ярослав Демкин', 20
  UNION ALL SELECT '2025-07-16'::date, 'ТОП Беляево', 'Вероника Тарасова', 5
  UNION ALL SELECT '2025-07-16'::date, 'КиберВан Балашиха', 'Никита', 12
  UNION ALL SELECT '2025-07-16'::date, 'КиберВан Балашиха', 'Элеонора', 15
  UNION ALL SELECT '2025-07-16'::date, 'ТОП Речной', 'Виктория', 3
  UNION ALL SELECT '2025-07-17'::date, 'ТОП Речной', 'Виктория', 1
  UNION ALL SELECT '2025-07-17'::date, 'ТОП Речной', 'Денис', 2
  UNION ALL SELECT '2025-07-17'::date, 'ТОП Балашиха Академия', 'Элеонора', 12
  UNION ALL SELECT '2025-07-17'::date, 'ТОП Балашиха Академия', 'Никита', 7
  UNION ALL SELECT '2025-07-17'::date, 'ТОП Балашиха Колледж', 'Никита', 1
  UNION ALL SELECT '2025-07-17'::date, 'ТОП Беляево', 'Диана Гумерова', 30
  UNION ALL SELECT '2025-07-17'::date, 'ТОП Реутов', 'Ярослав Демкин', 20
  UNION ALL SELECT '2025-07-17'::date, 'ТОП Реутов', 'Андрей', 10
  UNION ALL SELECT '2025-07-17'::date, 'ТОП Реутов', 'Всеволод Исаев', 11
  UNION ALL SELECT '2025-07-17'::date, 'ТОП Воскресенск', 'Майя Дзюба', 5
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