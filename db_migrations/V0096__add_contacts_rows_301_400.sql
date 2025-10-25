-- Добавляем строки 301-400 из эталонной таблицы

WITH target_counts AS (
  SELECT '2025-07-17'::date as date, 'КиберВан Жилезнодорожный' as org, 'Алексей' as promoter, 30 as count
  UNION ALL SELECT '2025-07-18'::date, 'ТОП Митино', 'Диана Гумерова', 26
  UNION ALL SELECT '2025-07-18'::date, 'ТОП Воскресенск', 'Майя Дзюба', 2
  UNION ALL SELECT '2025-07-18'::date, 'ТОП Речной', 'Диана Гумерова', 10
  UNION ALL SELECT '2025-07-18'::date, 'ТОП Щелковская', 'Артём 2097', 4
  UNION ALL SELECT '2025-07-18'::date, 'ТОП Щелковская', 'Денис', 2
  UNION ALL SELECT '2025-07-19'::date, 'ТОП Балашиха Школа', 'Арсений', 9
  UNION ALL SELECT '2025-07-19'::date, 'ТОП Балашиха Академия', 'Арсений', 3
  UNION ALL SELECT '2025-07-19'::date, 'ТОП Балашиха Школа', 'Алексей', 8
  UNION ALL SELECT '2025-07-19'::date, 'ТОП Балашиха Академия', 'Алексей', 1
  UNION ALL SELECT '2025-07-19'::date, 'ТОП Балашиха Школа', 'Элеонора', 2
  UNION ALL SELECT '2025-07-19'::date, 'ТОП Балашиха Академия', 'Элеонора', 5
  UNION ALL SELECT '2025-07-19'::date, 'ТОП Тимирязевская Академия', 'Диана Гумерова', 15
  UNION ALL SELECT '2025-07-19'::date, 'ТОП Тимирязевская Академия', 'Диана Чугреева', 8
  UNION ALL SELECT '2025-07-19'::date, 'ТОП Тимирязевская Школа', 'Диана Гумерова', 1
  UNION ALL SELECT '2025-07-19'::date, 'ТОП Тимирязевская Школа', 'Маргарита', 1
  UNION ALL SELECT '2025-07-20'::date, 'ТОП Митино', 'Диана Гумерова', 24
  UNION ALL SELECT '2025-07-20'::date, 'ТОП Щелковская', 'Элеонора', 5
  UNION ALL SELECT '2025-07-20'::date, 'ТОП Балашиха Школа', 'Никита', 3
  UNION ALL SELECT '2025-07-20'::date, 'ТОП Беляево', 'Виктория', 6
  UNION ALL SELECT '2025-07-20'::date, 'ТОП Ногинск', 'Максим', 8
  UNION ALL SELECT '2025-07-20'::date, 'ТОП Ногинск', 'Андерей', 8
  UNION ALL SELECT '2025-07-20'::date, 'ТОП Ногинск', 'Алексей', 15
  UNION ALL SELECT '2025-07-20'::date, 'ТОП Ногинск', 'Арсений', 15
  UNION ALL SELECT '2025-07-20'::date, 'ТОП Ногинск', 'Денис', 2
  UNION ALL SELECT '2025-07-20'::date, 'ТОП Ногинск', 'Михаил Пичушкин', 4
  UNION ALL SELECT '2025-07-20'::date, 'ТОП Воскресенск', 'Майя Дзюба', 7
  UNION ALL SELECT '2025-07-20'::date, 'ТОП Воскресенск', 'Денис', 13
  UNION ALL SELECT '2025-07-20'::date, 'ТОП Шаболовская', 'Виктория', 2
  UNION ALL SELECT '2025-07-20'::date, 'ТОП Шаболовская', 'Арсений', 3
  UNION ALL SELECT '2025-07-20'::date, 'ТОП Шаболовская', 'Алексей', 1
  UNION ALL SELECT '2025-07-21'::date, 'ТОП Беляево', 'Диана Гумерова', 20
  UNION ALL SELECT '2025-07-21'::date, 'ТОП Беляево', 'Всеволод Исаев', 5
  UNION ALL SELECT '2025-07-22'::date, 'ТОП Перово Академия', 'Ярослав Демкин', 18
  UNION ALL SELECT '2025-07-22'::date, 'ТОП Перово Академия', 'Диана Чугреева', 7
  UNION ALL SELECT '2025-07-22'::date, 'ТОП Перово Академия', 'Арсений', 7
  UNION ALL SELECT '2025-07-22'::date, 'ТОП Перово Академия', 'Алексей', 2
  UNION ALL SELECT '2025-07-23'::date, 'ТОП Щелковская', 'Арсений', 5
  UNION ALL SELECT '2025-07-23'::date, 'ТОП Щелковская', 'Алексей', 4
  UNION ALL SELECT '2025-07-23'::date, 'Воркаут Царицыно', 'Майя Дзюба', 4
  UNION ALL SELECT '2025-07-23'::date, 'Воркаут Царицыно', 'Всеволод Исаев', 5
  UNION ALL SELECT '2025-07-23'::date, 'Воркаут Царицыно', 'Артём', 1
  UNION ALL SELECT '2025-07-23'::date, 'КиберВан Жилезнодорожный', 'Алексей', 12
  UNION ALL SELECT '2025-07-23'::date, 'КиберВан Жилезнодорожный', 'Арсений', 23
  UNION ALL SELECT '2025-07-24'::date, 'ТОП Воскресенск', 'Майя Дзюба', 12
  UNION ALL SELECT '2025-07-24'::date, 'ТОП Воскресенск', 'Денис', 7
  UNION ALL SELECT '2025-07-24'::date, 'КиберВан Жилезнодорожный', 'Алексей', 10
  UNION ALL SELECT '2025-07-24'::date, 'КиберВан Жилезнодорожный', 'Арсений', 15
  UNION ALL SELECT '2025-07-24'::date, 'КиберВан Жилезнодорожный', 'Дмитрий', 4
  UNION ALL SELECT '2025-07-25'::date, 'ТОП Воскресенск', 'Майя Дзюба', 11
  UNION ALL SELECT '2025-07-25'::date, 'Юферст Севастопольская', 'Алексей', 15
  UNION ALL SELECT '2025-07-25'::date, 'Юферст Севастопольская', 'Арсений', 15
  UNION ALL SELECT '2025-07-25'::date, 'Сотка', 'Денис', 3
  UNION ALL SELECT '2025-07-25'::date, 'Сотка', 'Михаил Пичушкин', 8
  UNION ALL SELECT '2025-07-25'::date, 'ТОП Кутузовская', 'Всеволод Исаев', 3
  UNION ALL SELECT '2025-07-25'::date, 'ТОП Кутузовская', 'Виктор', 2
  UNION ALL SELECT '2025-07-26'::date, 'ТОП Кутузовская', 'Алексей', 17
  UNION ALL SELECT '2025-07-26'::date, 'Воркаут Царицыно', 'Диана Гумерова', 32
  UNION ALL SELECT '2025-07-27'::date, 'ТОП Кутузовская', 'Алексей Шкитин', 3
  UNION ALL SELECT '2025-07-27'::date, 'Сотка', 'Илья Гусаков', 11
  UNION ALL SELECT '2025-07-27'::date, 'Сотка', 'Денис Бутылкин', 10
  UNION ALL SELECT '2025-07-27'::date, 'Сотка', 'Арсений Петров', 4
  UNION ALL SELECT '2025-07-28'::date, 'ТОП Щелковская', 'Эмирлан Аданов', 3
  UNION ALL SELECT '2025-07-28'::date, 'ТОП Щелковская', 'Денис', 1
  UNION ALL SELECT '2025-07-28'::date, 'ТОП Щелковская', 'Иван Гаранин', 3
  UNION ALL SELECT '2025-07-28'::date, 'Сотка', 'Илья Гусаков', 5
  UNION ALL SELECT '2025-07-28'::date, 'Сотка', 'Денис Бутылкин', 2
  UNION ALL SELECT '2025-07-28'::date, 'Дзюдо Марьино', 'Всеволод Исаев', 5
  UNION ALL SELECT '2025-07-29'::date, 'ТОП Тимирязевская Академия', 'Дарья Котик', 9
  UNION ALL SELECT '2025-07-29'::date, 'ТОП Тимирязевская Академия', 'Руслана Шарипова', 2
  UNION ALL SELECT '2025-07-29'::date, 'ТОП Тимирязевская Академия', 'Денис', 3
  UNION ALL SELECT '2025-07-29'::date, 'Сотка', 'Илья Гусаков', 4
  UNION ALL SELECT '2025-07-29'::date, 'ТОП Щелковская', 'Михаил Щепетов', 8
  UNION ALL SELECT '2025-07-30'::date, 'Сотка', 'Всеволод Исаев', 9
  UNION ALL SELECT '2025-07-30'::date, 'Сотка', 'Илья Гусаков', 3
  UNION ALL SELECT '2025-07-30'::date, 'ТОП Речной', 'Владислав Ненашев', 5
  UNION ALL SELECT '2025-07-30'::date, 'ТОП Речной', 'Владислав Земсков', 4
  UNION ALL SELECT '2025-07-30'::date, 'ТОП Щелковская', 'Алексей Шкитин', 1
  UNION ALL SELECT '2025-07-31'::date, 'ТОП Речной', 'Владислав Ненашев', 5
  UNION ALL SELECT '2025-07-31'::date, 'ТОП Речной', 'Владислав Земсков', 5
  UNION ALL SELECT '2025-07-31'::date, 'ТОП Речной', 'Наталья Красенко', 1
  UNION ALL SELECT '2025-07-31'::date, 'ТОП Речной', 'Ульяна Быкова', 1
  UNION ALL SELECT '2025-07-31'::date, 'ТОП Воскресенск', 'Майя Дзюба', 12
  UNION ALL SELECT '2025-08-01'::date, 'ТОП Кутузовская', 'Анастасия Шмакова', 7
  UNION ALL SELECT '2025-08-01'::date, 'ТОП Воскресенск', 'Майя Дзюба', 8
  UNION ALL SELECT '2025-08-01'::date, 'ТОП Химки', 'Ульяна Быкова', 2
  UNION ALL SELECT '2025-08-02'::date, 'ТОП Речной', 'Владислав Ненашев', 5
  UNION ALL SELECT '2025-08-02'::date, 'Дзюдо Марьино', 'Владислав Ненашев', 12
  UNION ALL SELECT '2025-08-02'::date, 'Дзюдо Марьино', 'Даниил Назаренко', 4
  UNION ALL SELECT '2025-08-02'::date, 'Сотка', 'Алексей Шкитин', 14
  UNION ALL SELECT '2025-08-02'::date, 'Сотка', 'Ульяна Быкова', 5
  UNION ALL SELECT '2025-08-02'::date, 'Сотка', 'Никита Чусляев', 10
  UNION ALL SELECT '2025-08-03'::date, 'Сотка', 'Владислав Ненашев', 1
  UNION ALL SELECT '2025-08-03'::date, 'Сотка', 'Никита Чусляев', 1
  UNION ALL SELECT '2025-08-03'::date, 'Сотка', 'Амир Абдулаев', 8
  UNION ALL SELECT '2025-08-04'::date, 'ТОП Речной', 'Всеволод Исаев', 7
  UNION ALL SELECT '2025-08-05'::date, 'ТОП Химки', 'Филипп Олейник', 18
  UNION ALL SELECT '2025-08-05'::date, 'ТОП Химки', 'Иван Кустарев', 4
  UNION ALL SELECT '2025-08-05'::date, 'ТОП Химки', 'Анастасия Шмакова', 6
  UNION ALL SELECT '2025-08-05'::date, 'Воркаут Царицыно', 'Владислав Ненашев', 3
  UNION ALL SELECT '2025-08-05'::date, 'Воркаут Царицыно', 'Даниил Назаренко', 1
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