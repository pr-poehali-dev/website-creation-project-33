-- Добавляем строки 501-600 из эталонной таблицы

WITH target_counts AS (
  SELECT '2025-08-21'::date as date, 'ТОП Воскресенск' as org, 'Майя Дзюба' as promoter, 6 as count
  UNION ALL SELECT '2025-08-21'::date, 'ТОП Тушинская', 'Владислава Долматова', 7
  UNION ALL SELECT '2025-08-21'::date, 'Сотка', 'Диана Гумерова', 16
  UNION ALL SELECT '2025-08-21'::date, 'Каратэ Пражская', 'Диана Гумерова', 12
  UNION ALL SELECT '2025-08-21'::date, 'КиберВан Жилезнодорожный', 'Алексей Шкитин', 1
  UNION ALL SELECT '2025-08-21'::date, 'КиберВан Балашиха', 'Филипп Олейник', 5
  UNION ALL SELECT '2025-08-21'::date, 'КиберВан Балашиха', 'Ярослав Тарасенко', 19
  UNION ALL SELECT '2025-08-22'::date, 'ТОП Тушинская', 'Владислава Долматова', 3
  UNION ALL SELECT '2025-08-22'::date, 'КиберВан Жилезнодорожный', 'Ярослав Тарасенко', 10
  UNION ALL SELECT '2025-08-22'::date, 'КиберВан Жилезнодорожный', 'Евгений Аблулкин', 9
  UNION ALL SELECT '2025-08-23'::date, 'ТОП Домодедовская', 'Диана Гумерова', 16
  UNION ALL SELECT '2025-08-23'::date, 'ТОП Ногинск', 'Андрей Широков', 12
  UNION ALL SELECT '2025-08-23'::date, 'ТОП Ногинск', 'Михаил Пичушкин', 1
  UNION ALL SELECT '2025-08-24'::date, 'Воркаут Царицыно', 'Диана Гумерова', 25
  UNION ALL SELECT '2025-08-24'::date, 'ТОП Тушинская', 'Всеволод Исаев', 2
  UNION ALL SELECT '2025-08-25'::date, 'ТОП Тушинская', 'Владислава Долматова', 2
  UNION ALL SELECT '2025-08-25'::date, 'ТОП Беляево', 'Ярослав Демкин', 4
  UNION ALL SELECT '2025-08-25'::date, 'ТОП Беляево', 'Полина Копеина', 4
  UNION ALL SELECT '2025-08-26'::date, 'ТОП Митино', 'Владислава Долматова', 5
  UNION ALL SELECT '2025-08-26'::date, 'ТОП Коломенская', 'Диана Гумерова', 10
  UNION ALL SELECT '2025-08-27'::date, 'ТОП Академическая', 'Ярослав Демкин', 2
  UNION ALL SELECT '2025-08-27'::date, 'ТОП Академическая', 'Всеволод Исаев', 2
  UNION ALL SELECT '2025-08-27'::date, 'Балет Сходненская', 'Ярослав Тарасенко', 11
  UNION ALL SELECT '2025-08-27'::date, 'Балет Сходненская', 'Евгений Аблулкин', 10
  UNION ALL SELECT '2025-08-27'::date, 'ТОП Митино', 'Владислава Долматова', 15
  UNION ALL SELECT '2025-08-27'::date, 'ТОП Митино', 'Филипп Олейник', 11
  UNION ALL SELECT '2025-08-27'::date, 'ТОП Коломенская', 'Диана Гумерова', 12
  UNION ALL SELECT '2025-08-28'::date, 'ТОП Беляево', 'Диана Гумерова', 30
  UNION ALL SELECT '2025-08-28'::date, 'ТОП Щелковская', 'Филипп Олейник', 5
  UNION ALL SELECT '2025-08-29'::date, 'КиберВан Балашиха', 'Ярослав Тарасенко', 8
  UNION ALL SELECT '2025-08-29'::date, 'КиберВан Балашиха', 'Евгений Аблулкин', 5
  UNION ALL SELECT '2025-08-29'::date, 'ТОП Академическая', 'Всеволод Исаев', 1
  UNION ALL SELECT '2025-08-30'::date, 'КиберВан Электросталь', 'Андрей Широков', 11
  UNION ALL SELECT '2025-08-30'::date, 'КиберВан Биберево', 'Владислава Долматова', 6
  UNION ALL SELECT '2025-08-30'::date, 'Сотка', 'Александра Семенцова', 1
  UNION ALL SELECT '2025-08-30'::date, 'КиберВан Жилезнодорожный', 'Мария ФАМИЛИЯ???', 3
  UNION ALL SELECT '2025-08-31'::date, 'КиберВан Электросталь', 'Андрей Широков', 13
  UNION ALL SELECT '2025-08-31'::date, 'КиберВан Биберево', 'Владислава Долматова', 10
  UNION ALL SELECT '2025-09-01'::date, 'КиберВан Балашиха', 'Диана Гумерова', 36
  UNION ALL SELECT '2025-09-06'::date, 'КиберВан Электросталь', 'Андрей Широков', 10
  UNION ALL SELECT '2025-09-07'::date, 'КиберВан Электросталь', 'Майя Дзюба', 20
  UNION ALL SELECT '2025-09-07'::date, 'ТОП Тушинская', 'Владислава Долматова', 15
  UNION ALL SELECT '2025-09-10'::date, 'КиберВан Балашиха', 'Кристина Карапетян', 15
  UNION ALL SELECT '2025-09-11'::date, 'КиберВан Балашиха', 'Кристина Карапетян', 23
  UNION ALL SELECT '2025-09-11'::date, 'ТОП Юго-западная', 'Илья Турченко', 2
  UNION ALL SELECT '2025-09-11'::date, 'ТОП Юго-западная', 'Ксения Вознесенская', 2
  UNION ALL SELECT '2025-09-12'::date, 'ТОП Юго-западная', 'Маргарита Чуешева', 5
  UNION ALL SELECT '2025-09-13'::date, 'ТОП Беляево', 'Диана Гумерова', 24
  UNION ALL SELECT '2025-09-13'::date, 'КиберВан Электросталь', 'Майя Дзюба', 25
  UNION ALL SELECT '2025-09-14'::date, 'КиберВан Биберево', 'Владислава Долматова', 16
  UNION ALL SELECT '2025-09-15'::date, 'КиберВан Балашиха', 'Галина Игнатенко', 13
  UNION ALL SELECT '2025-09-15'::date, 'КиберВан Балашиха', 'Кристина Карапетян', 3
  UNION ALL SELECT '2025-09-15'::date, 'ТОП Юго-западная', 'Ольга Салтыкова', 16
  UNION ALL SELECT '2025-09-16'::date, 'КиберВан Балашиха', 'Кристина Карапетян', 14
  UNION ALL SELECT '2025-09-16'::date, 'Сотка', 'Диана Гумерова', 18
  UNION ALL SELECT '2025-09-17'::date, 'КиберВан Балашиха', 'Галина Игнатенко', 7
  UNION ALL SELECT '2025-09-17'::date, 'Сотка', 'Диана Гумерова', 10
  UNION ALL SELECT '2025-09-18'::date, 'КиберВан Балашиха', 'Галина Игнатенко', 4
  UNION ALL SELECT '2025-09-18'::date, 'ТОП Юго-западная', 'Ольга Салтыкова', 8
  UNION ALL SELECT '2025-09-18'::date, 'ТОП Юго-западная', 'Кристина Маркаускайте', 1
  UNION ALL SELECT '2025-09-18'::date, 'КиберВан Балашиха', 'Галина Игнатенко', 4
  UNION ALL SELECT '2025-09-18'::date, 'ТОП Юго-западная', 'Ольга Салтыкова', 8
  UNION ALL SELECT '2025-09-20'::date, 'Сотка', 'Диана Гумерова', 40
  UNION ALL SELECT '2025-09-20'::date, 'КиберВан Биберево', 'Владислава Долматова', 10
  UNION ALL SELECT '2025-09-20'::date, 'ТОП Тушинская', 'Владислава Долматова', 5
  UNION ALL SELECT '2025-09-20'::date, 'ТОП Тушинская', 'Кристина Маркаускайте', 3
  UNION ALL SELECT '2025-09-20'::date, 'ТОП Домодедовская', 'Кристина Маркаускайте', 1
  UNION ALL SELECT '2025-09-21'::date, 'КиберВан Биберево', 'Владислава Долматова', 15
  UNION ALL SELECT '2025-09-21'::date, 'КиберВан Электросталь', 'Майя Дзюба', 8
  UNION ALL SELECT '2025-09-21'::date, 'Сотка', 'Диана Гумерова', 21
  UNION ALL SELECT '2025-09-21'::date, 'Сотка', 'Валерия Федоренчик', 6
  UNION ALL SELECT '2025-09-22'::date, 'Юниум Люблино', 'Кристина Маркаускайте', 8
  UNION ALL SELECT '2025-09-23'::date, 'ТОП Коломенская', 'Ольга Салтыкова', 10
  UNION ALL SELECT '2025-09-24'::date, 'Юниум Люблино', 'Ольга Алексеева', 1
  UNION ALL SELECT '2025-09-24'::date, 'Юниум Люблино', 'Гюзель Саидгазова', 3
  UNION ALL SELECT '2025-09-24'::date, 'Юниум Люблино', 'Кристина Маркаускайте', 6
  UNION ALL SELECT '2025-09-24'::date, 'КиберВан Балашиха', 'Кристина Карапетян', 5
  UNION ALL SELECT '2025-09-25'::date, 'Юниум Люблино', 'Ольга Алексеева', 7
  UNION ALL SELECT '2025-09-25'::date, 'ТОП Беляево', 'Кристина Маркаускайте', 7
  UNION ALL SELECT '2025-09-26'::date, 'Сотка', 'Ольга Салтыкова', 4
  UNION ALL SELECT '2025-09-26'::date, 'ТОП Беляево', 'Ольга Алексеева', 7
  UNION ALL SELECT '2025-09-27'::date, 'КиберВан Алексеевская', 'Владислава Долматова', 13
  UNION ALL SELECT '2025-09-27'::date, 'ТОП Беляево', 'Кристина Маркаускайте', 8
  UNION ALL SELECT '2025-09-28'::date, 'КиберВан Алексеевская', 'Владислава Долматова', 9
  UNION ALL SELECT '2025-09-29'::date, 'Сотка', 'Ольга Салтыкова', 5
  UNION ALL SELECT '2025-09-29'::date, 'Сотка', 'Владислава Долматова', 5
  UNION ALL SELECT '2025-09-29'::date, 'ТОП Щелковская', 'Кристина Маркаускайте', 5
  UNION ALL SELECT '2025-09-30'::date, 'ТОП Речной', 'Ольга Алексеева', 4
  UNION ALL SELECT '2025-10-01'::date, 'ТОП Речной', 'Ольга Алексеева', 9
  UNION ALL SELECT '2025-10-02'::date, 'Сотка', 'Диана Гумерова', 2
  UNION ALL SELECT '2025-10-02'::date, 'Сотка', 'Владислава Долматова', 3
  UNION ALL SELECT '2025-10-02'::date, 'Сотка', 'Кристина Маркаускайте', 0
  UNION ALL SELECT '2025-10-03'::date, 'Сотка', 'Ольга Салтыкова', 2
  UNION ALL SELECT '2025-10-04'::date, 'КиберВан Деловой Центр', 'Кристина Маркаускайте', 12
  UNION ALL SELECT '2025-10-04'::date, 'КиберВан Деловой Центр', 'Владислава Долматова', 15
  UNION ALL SELECT '2025-10-04'::date, 'Сотка', 'Артём Сушко', 2
  UNION ALL SELECT '2025-10-06'::date, 'КиберВан Бабушкинкая', 'Кристина Маркаускайте', 4
  UNION ALL SELECT '2025-10-07'::date, 'Сотка', 'Ольга Салтыкова', 6
  UNION ALL SELECT '2025-10-08'::date, 'Сотка', 'Кристина Маркаускайте', 1
  UNION ALL SELECT '2025-10-08'::date, 'Сотка', 'Александр Тресцов', 2
  UNION ALL SELECT '2025-10-09'::date, 'Сотка', 'Ольга Салтыкова', 6
  UNION ALL SELECT '2025-10-09'::date, 'Сотка', 'Александр Тресцов', 1
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