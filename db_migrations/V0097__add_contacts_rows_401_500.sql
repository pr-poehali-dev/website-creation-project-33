-- Добавляем строки 401-500 из эталонной таблицы

WITH target_counts AS (
  SELECT '2025-08-05'::date as date, 'ТОП Речной' as org, 'Екатерина Маркова' as promoter, 10 as count
  UNION ALL SELECT '2025-08-05'::date, 'ТОП Щелковская', 'Денис Васильев', 1
  UNION ALL SELECT '2025-08-05'::date, 'ТОП Щелковская', 'Сергей Арнаут', 3
  UNION ALL SELECT '2025-08-05'::date, 'ТОП Щелковская', 'Стефан Савинков', 1
  UNION ALL SELECT '2025-08-06'::date, 'ТОП Академическая', 'Филипп Олейник', 12
  UNION ALL SELECT '2025-08-06'::date, 'ТОП Академическая', 'Владислав Земсков', 1
  UNION ALL SELECT '2025-08-06'::date, 'ТОП Академическая', 'Иван Кустарев', 7
  UNION ALL SELECT '2025-08-06'::date, 'Воркаут Царицыно', 'Владислав Ненашев', 3
  UNION ALL SELECT '2025-08-06'::date, 'Воркаут Царицыно', 'Даниил Назаренко', 2
  UNION ALL SELECT '2025-08-06'::date, 'ТОП Речной', 'Владислава Долматова', 6
  UNION ALL SELECT '2025-08-06'::date, 'ТОП Речной', 'Денис Васильев', 8
  UNION ALL SELECT '2025-08-06'::date, 'ТОП Тушинская', 'Никита Чусляев', 1
  UNION ALL SELECT '2025-08-06'::date, 'ТОП Воскресенск', 'Майя Дзюба', 1
  UNION ALL SELECT '2025-08-07'::date, 'ТОП Тимирязевская Академия', 'Денис Васильев', 5
  UNION ALL SELECT '2025-08-07'::date, 'ТОП Воскресенск', 'Майя Дзюба', 8
  UNION ALL SELECT '2025-08-07'::date, 'ТОП Щелковская', 'Алексей Шкитин', 1
  UNION ALL SELECT '2025-08-07'::date, 'ТОП Щелковская', 'Арсений Петров', 1
  UNION ALL SELECT '2025-08-07'::date, 'ТОП Речной', 'Никита Чусляев', 3
  UNION ALL SELECT '2025-08-07'::date, 'ТОП Речной', 'Владислава Долматова', 5
  UNION ALL SELECT '2025-08-07'::date, 'ТОП Тушинская', 'Филипп Олейник', 1
  UNION ALL SELECT '2025-08-07'::date, 'ТОП Академическая', 'Анастасия Шмакова', 4
  UNION ALL SELECT '2025-08-07'::date, 'Воркаут Царицыно', 'Владислав Ненашев', 7
  UNION ALL SELECT '2025-08-07'::date, 'Воркаут Царицыно', 'Даниил Назаренко', 7
  UNION ALL SELECT '2025-08-07'::date, 'Сотка', 'Никита Чусляев', 2
  UNION ALL SELECT '2025-08-07'::date, 'Сотка', 'Владислава Долматова', 2
  UNION ALL SELECT '2025-08-08'::date, 'ТОП Воскресенск', 'Майя Дзюба', 9
  UNION ALL SELECT '2025-08-08'::date, 'ТОП Тушинская', 'Всеволод Исаев', 3
  UNION ALL SELECT '2025-08-09'::date, 'ТОП Митино', 'Арсений Петров', 6
  UNION ALL SELECT '2025-08-09'::date, 'ТОП Митино', 'Алексей Шкитин', 3
  UNION ALL SELECT '2025-08-09'::date, 'ТОП Шаболовская', 'Анастасия Шмакова', 3
  UNION ALL SELECT '2025-08-09'::date, 'Сотка', 'Артём Сикорин', 4
  UNION ALL SELECT '2025-08-09'::date, 'Сотка', 'Денис Васильев', 1
  UNION ALL SELECT '2025-08-10'::date, 'ТОП Тушинская', 'Владислава Долматова', 8
  UNION ALL SELECT '2025-08-10'::date, 'ТОП Тушинская', 'Алексей Шкитин', 2
  UNION ALL SELECT '2025-08-10'::date, 'ТОП Тушинская', 'Арсений Петров', 6
  UNION ALL SELECT '2025-08-10'::date, 'ТОП Щелковская', 'Владислав Ненашев', 2
  UNION ALL SELECT '2025-08-10'::date, 'ТОП Щелковская', 'Даниил Назаренко', 1
  UNION ALL SELECT '2025-08-10'::date, 'Сотка', 'Денис Васильев', 6
  UNION ALL SELECT '2025-08-10'::date, 'Сотка', 'Ольга ФАМИЛИЯ????', 3
  UNION ALL SELECT '2025-08-11'::date, 'ТОП Щелковская', 'Ярослав Демкин', 13
  UNION ALL SELECT '2025-08-11'::date, 'ТОП Тушинская', 'Владислава Долматова', 4
  UNION ALL SELECT '2025-08-11'::date, 'ТОП Митино', 'Михаил Пичушкин', 2
  UNION ALL SELECT '2025-08-11'::date, 'ТОП Митино', 'Владислава Долматова', 1
  UNION ALL SELECT '2025-08-11'::date, 'ТОП Воскресенск', 'Майя Дзюба', 2
  UNION ALL SELECT '2025-08-12'::date, 'ТОП Щелковская', 'Сергей Сливко', 11
  UNION ALL SELECT '2025-08-12'::date, 'ТОП Воскресенск', 'Майя Дзюба', 7
  UNION ALL SELECT '2025-08-12'::date, 'ТОП Академическая', 'Илья Гусаков', 1
  UNION ALL SELECT '2025-08-12'::date, 'ТОП Академическая', 'Денис Бутылкин', 3
  UNION ALL SELECT '2025-08-12'::date, 'ТОП Митино', 'Екатерина Маркова', 1
  UNION ALL SELECT '2025-08-12'::date, 'ТОП Беляево', 'Артём Сикорин', 4
  UNION ALL SELECT '2025-08-12'::date, 'ТОП Беляево', 'Антон Мельников', 4
  UNION ALL SELECT '2025-08-12'::date, 'Воркаут Царицыно', 'Владислав Ненашев', 1
  UNION ALL SELECT '2025-08-13'::date, 'ТОП Коломенская', 'Андриана Смолякова', 13
  UNION ALL SELECT '2025-08-13'::date, 'ТОП Коломенская', 'Аделина Пугачева', 13
  UNION ALL SELECT '2025-08-13'::date, 'ТОП Коломенская', 'Филипп Олейник', 4
  UNION ALL SELECT '2025-08-13'::date, 'ТОП Коломенская', 'Иван Кустарев', 2
  UNION ALL SELECT '2025-08-13'::date, 'ТОП Митино', 'Диана Чугреева', 11
  UNION ALL SELECT '2025-08-13'::date, 'ТОП Митино', 'Алексей Шкитин', 8
  UNION ALL SELECT '2025-08-13'::date, 'ТОП Митино', 'Всеволод Исаев', 2
  UNION ALL SELECT '2025-08-13'::date, 'ТОП Митино', 'Владислава Долматова', 6
  UNION ALL SELECT '2025-08-13'::date, 'ТОП Щелковская', 'Ярослав Демкин', 2
  UNION ALL SELECT '2025-08-13'::date, 'ТОП Воскресенск', 'Майя Дзюба', 9
  UNION ALL SELECT '2025-08-13'::date, 'ТОП Беляево', 'Денис Бутылкин', 3
  UNION ALL SELECT '2025-08-14'::date, 'ТОП Воскресенск', 'Майя Дзюба', 6
  UNION ALL SELECT '2025-08-14'::date, 'ТОП Тимирязевская Академия', 'Диана Чугреева', 6
  UNION ALL SELECT '2025-08-14'::date, 'ТОП Академическая', 'Иван Марфицын', 5
  UNION ALL SELECT '2025-08-14'::date, 'ТОП Тушинская', 'Владислава Долматова', 6
  UNION ALL SELECT '2025-08-14'::date, 'ТОП Тушинская', 'Сергей Сливко', 8
  UNION ALL SELECT '2025-08-14'::date, 'Воркаут Царицыно', 'Филипп Олейник', 8
  UNION ALL SELECT '2025-08-14'::date, 'Воркаут Царицыно', 'Иван Кустарев', 8
  UNION ALL SELECT '2025-08-15'::date, 'ТОП Щелковская', 'Сергей Сливко', 7
  UNION ALL SELECT '2025-08-15'::date, 'ТОП Речной', 'Иван Кустарев', 7
  UNION ALL SELECT '2025-08-15'::date, 'ТОП Речной', 'Филипп Олейник', 7
  UNION ALL SELECT '2025-08-15'::date, 'ТОП Митино', 'Сергей Сливко', 10
  UNION ALL SELECT '2025-08-15'::date, 'ТОП Академическая', 'Иван Марфицын', 7
  UNION ALL SELECT '2025-08-16'::date, 'ТОП Ногинск', 'Денис Васильев', 1
  UNION ALL SELECT '2025-08-16'::date, 'ТОП Ногинск', 'Иван Марфицын', 13
  UNION ALL SELECT '2025-08-16'::date, 'ТОП Ногинск', 'Алексей Шкитин', 15
  UNION ALL SELECT '2025-08-16'::date, 'ТОП Академическая', 'Диана Гумерова', 10
  UNION ALL SELECT '2025-08-16'::date, 'ТОП Беляево', 'Диана Гумерова', 11
  UNION ALL SELECT '2025-08-17'::date, 'ТОП Тушинская', 'Владислава Долматова', 7
  UNION ALL SELECT '2025-08-17'::date, 'ТОП Речной', 'Всеволод Исаев', 1
  UNION ALL SELECT '2025-08-17'::date, 'ТОП Речной', 'Ярослав Демкин', 11
  UNION ALL SELECT '2025-08-17'::date, 'КиберВан Алексеевская', 'Диана Гумерова', 8
  UNION ALL SELECT '2025-08-18'::date, 'Сотка', 'Диана Гумерова', 31
  UNION ALL SELECT '2025-08-18'::date, 'ТОП Беляево', 'Ярослав Демкин', 10
  UNION ALL SELECT '2025-08-18'::date, 'ТОП Щелковская', 'Сергей Сливко', 6
  UNION ALL SELECT '2025-08-18'::date, 'ТОП Воскресенск', 'Майя Дзюба', 8
  UNION ALL SELECT '2025-08-18'::date, 'ТОП Тушинская', 'Владислава Долматова', 2
  UNION ALL SELECT '2025-08-19'::date, 'Сотка', 'Диана Гумерова', 40
  UNION ALL SELECT '2025-08-19'::date, 'ТОП Воскресенск', 'Майя Дзюба', 6
  UNION ALL SELECT '2025-08-19'::date, 'ТОП Щелковская', 'Сергей Сливко', 7
  UNION ALL SELECT '2025-08-20'::date, 'ТОП Щелковская', 'Сергей Сливко', 5
  UNION ALL SELECT '2025-08-20'::date, 'ТОП Воскресенск', 'Майя Дзюба', 12
  UNION ALL SELECT '2025-08-20'::date, 'ТОП Речной', 'Владислава Долматова', 9
  UNION ALL SELECT '2025-08-20'::date, 'ТОП Речной', 'Всеволод Исаев', 3
  UNION ALL SELECT '2025-08-20'::date, 'ТОП Речной', 'Ярослав Демкин', 9
  UNION ALL SELECT '2025-08-20'::date, 'Сотка', 'Диана Гумерова', 34
  UNION ALL SELECT '2025-08-20'::date, 'Сотка', 'Евгений Аблулкин', 16
  UNION ALL SELECT '2025-08-20'::date, 'Сотка', 'Ярослав Тарасенко', 21
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