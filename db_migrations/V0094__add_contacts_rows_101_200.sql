-- Добавляем строки 101-200 из эталонной таблицы

WITH target_counts AS (
  SELECT '2025-06-08'::date as date, 'ТОП Беляево' as org, 'Михаил' as promoter, 2 as count
  UNION ALL SELECT '2025-06-08'::date, 'КиберВан', 'Артём', 8
  UNION ALL SELECT '2025-06-08'::date, 'КиберВан', 'Сергей', 6
  UNION ALL SELECT '2025-06-09'::date, 'ТОП Беляево', 'Михаил', 13
  UNION ALL SELECT '2025-06-09'::date, 'ТОП Беляево', 'Ярослав Демкин', 14
  UNION ALL SELECT '2025-06-09'::date, 'КиберВан', 'Филипп Олейник', 13
  UNION ALL SELECT '2025-06-09'::date, 'КиберВан', 'Артём', 2
  UNION ALL SELECT '2025-06-10'::date, 'ТОП Домодедовская', 'Михаил', 11
  UNION ALL SELECT '2025-06-10'::date, 'ТОП Домодедовская', 'Сергей', 19
  UNION ALL SELECT '2025-06-10'::date, 'ТОП Домодедовская', 'Филипп Олейник', 19
  UNION ALL SELECT '2025-06-10'::date, 'ТОП Шаболовская', 'Иван', 3
  UNION ALL SELECT '2025-06-13'::date, 'ТОП Академическая', 'Иван Науменко', 9
  UNION ALL SELECT '2025-06-13'::date, 'ТОП Академическая', 'Николай', 6
  UNION ALL SELECT '2025-06-13'::date, 'ТОП Академическая', 'Сергей', 1
  UNION ALL SELECT '2025-06-13'::date, 'ТОП Академическая', 'Илья', 7
  UNION ALL SELECT '2025-06-13'::date, 'ТОП Академическая', 'Ярослав Демкин', 15
  UNION ALL SELECT '2025-06-13'::date, 'ТОП Перово Академия', 'Филипп Олейник', 30
  UNION ALL SELECT '2025-06-13'::date, 'ТОП Перово Академия', 'Иван Марфицын', 21
  UNION ALL SELECT '2025-06-14'::date, 'ТОП Севастопольская', 'Варвара', 3
  UNION ALL SELECT '2025-06-14'::date, 'ТОП Севастопольская', 'Иван Марфицын', 14
  UNION ALL SELECT '2025-06-14'::date, 'ТОП Севастопольская', 'Иван', 12
  UNION ALL SELECT '2025-06-14'::date, 'ТОП Севастопольская', 'Ренат', 5
  UNION ALL SELECT '2025-06-14'::date, 'ТОП Севастопольская', 'Евгений', 8
  UNION ALL SELECT '2025-06-16'::date, 'ТОП Шаболовская', 'Филипп Олейник', 5
  UNION ALL SELECT '2025-06-16'::date, 'ТОП Шаболовская', 'Иван Кустарев', 3
  UNION ALL SELECT '2025-06-16'::date, 'ТОП Шаболовская', 'Евгений', 1
  UNION ALL SELECT '2025-06-16'::date, 'ТОП Шаболовская', 'Иван Науменко', 3
  UNION ALL SELECT '2025-06-16'::date, 'ТОП Шаболовская', 'Ренат', 6
  UNION ALL SELECT '2025-06-16'::date, 'ТОП Пушкино Колледж', 'Иван Науменко', 5
  UNION ALL SELECT '2025-06-16'::date, 'ТОП Пушкино', 'Иван Науменко', 5
  UNION ALL SELECT '2025-06-16'::date, 'ТОП Пушкино Колледж', 'Сергей', 4
  UNION ALL SELECT '2025-06-16'::date, 'ТОП Пушкино', 'Сергей', 8
  UNION ALL SELECT '2025-06-16'::date, 'Воркаут Царицыно', 'Филипп Олейник', 20
  UNION ALL SELECT '2025-06-16'::date, 'Воркаут Царицыно', 'Иван Кустарев', 12
  UNION ALL SELECT '2025-06-18'::date, 'ТОП Академическая', 'Амир', 3
  UNION ALL SELECT '2025-06-18'::date, 'ТОП Академическая', 'Филипп Олейник', 5
  UNION ALL SELECT '2025-06-18'::date, 'ТОП Академическая', 'Ренат', 1
  UNION ALL SELECT '2025-06-18'::date, 'ТОП Речной', 'Сергей', 12
  UNION ALL SELECT '2025-06-18'::date, 'ТОП Речной', 'Ярослав Демкин', 12
  UNION ALL SELECT '2025-06-18'::date, 'ТОП Речной', 'Иван Науменко', 7
  UNION ALL SELECT '2025-06-18'::date, 'ТОП Речной', 'Алиса', 5
  UNION ALL SELECT '2025-06-18'::date, 'ТОП Речной', 'Иван Марфицын', 1
  UNION ALL SELECT '2025-06-20'::date, 'ТОП Перово Академия', 'Ярослав Демкин', 18
  UNION ALL SELECT '2025-06-20'::date, 'ТОП Перово Академия', 'Иван Марфицын', 7
  UNION ALL SELECT '2025-06-20'::date, 'ТОП Перово Академия', 'Иван Мухин', 9
  UNION ALL SELECT '2025-06-20'::date, 'ТОП Академическая', 'Сергей', 12
  UNION ALL SELECT '2025-06-20'::date, 'ТОП Академическая', 'Дарья', 14
  UNION ALL SELECT '2025-06-20'::date, 'ТОП Мытищи', 'Диана Гумерова', 15
  UNION ALL SELECT '2025-06-20'::date, 'ТОП Мытищи', 'Кирилл', 8
  UNION ALL SELECT '2025-06-20'::date, 'ТОП Мытищи', 'Андрей', 4
  UNION ALL SELECT '2025-06-20'::date, 'ТОП Мытищи', 'Филипп Олейник', 15
  UNION ALL SELECT '2025-06-20'::date, 'ТОП Мытищи', 'Иван Кустарев', 12
  UNION ALL SELECT '2025-06-20'::date, 'ТОП Мытищи', 'Анастасия', 1
  UNION ALL SELECT '2025-06-20'::date, 'ТОП Щелково', 'Мария', 2
  UNION ALL SELECT '2025-06-21'::date, 'ТОП Беляево', 'Дарья', 18
  UNION ALL SELECT '2025-06-21'::date, 'ТОП Беляево', 'Иван Марфицын', 9
  UNION ALL SELECT '2025-06-21'::date, 'ТОП Беляево', 'Диана Гумерова', 20
  UNION ALL SELECT '2025-06-21'::date, 'ТОП Беляево', 'Вячеслав', 10
  UNION ALL SELECT '2025-06-21'::date, 'ТОП Беляево', 'Максим', 8
  UNION ALL SELECT '2025-06-21'::date, 'ТОП Люберцы', 'Филипп Олейник', 20
  UNION ALL SELECT '2025-06-21'::date, 'ТОП Люберцы', 'Иван Кустарев', 20
  UNION ALL SELECT '2025-06-21'::date, 'ТОП Шаболовская', 'Алиса К', 19
  UNION ALL SELECT '2025-06-21'::date, 'ТОП Шаболовская', 'Александр', 1
  UNION ALL SELECT '2025-06-22'::date, 'СкайПро', 'Дарья', 7
  UNION ALL SELECT '2025-06-22'::date, 'СкайПро', 'Алиса К', 10
  UNION ALL SELECT '2025-06-22'::date, 'СкайПро', 'Иван Кустарев', 1
  UNION ALL SELECT '2025-06-22'::date, 'СкайПро', 'Михаил', 5
  UNION ALL SELECT '2025-06-22'::date, 'СкайПро', 'Ещё 2 дня работы', 83
  UNION ALL SELECT '2025-06-23'::date, 'Воркаут Царицыно', 'Ярослав Демкин', 13
  UNION ALL SELECT '2025-06-23'::date, 'Воркаут Царицыно', 'Ульяна', 7
  UNION ALL SELECT '2025-06-24'::date, 'ТОП Академическая', 'Михаил', 5
  UNION ALL SELECT '2025-06-24'::date, 'ТОП Академическая', 'Филипп Олейник', 12
  UNION ALL SELECT '2025-06-24'::date, 'ТОП Академическая', 'Ульяна', 2
  UNION ALL SELECT '2025-06-24'::date, 'ТОП Академическая', 'Иван Кустарев', 8
  UNION ALL SELECT '2025-06-25'::date, 'ТОП Шаболовская', 'Алиса', 18
  UNION ALL SELECT '2025-06-25'::date, 'ТОП Шаболовская', 'Ярослав Демкин', 12
  UNION ALL SELECT '2025-06-25'::date, 'ТОП Шаболовская', 'Иван Попов', 3
  UNION ALL SELECT '2025-06-25'::date, 'ТОП Шаболовская', 'Михаил Г', 11
  UNION ALL SELECT '2025-06-25'::date, 'ТОП Шаболовская', 'Илья Т', 1
  UNION ALL SELECT '2025-06-26'::date, 'ТОП Речной', 'Степан', 6
  UNION ALL SELECT '2025-06-26'::date, 'ТОП Речной', 'Алиса', 6
  UNION ALL SELECT '2025-06-26'::date, 'ТОП Академическая', 'Михаил Г', 3
  UNION ALL SELECT '2025-06-26'::date, 'ТОП Академическая', 'Иван Попов', 4
  UNION ALL SELECT '2025-06-27'::date, 'ТОП Речной', 'Степан', 3
  UNION ALL SELECT '2025-06-28'::date, 'ТОП Пушкино', 'Степан', 9
  UNION ALL SELECT '2025-06-28'::date, 'ТОП Пушкино Колледж', 'Степан', 5
  UNION ALL SELECT '2025-06-28'::date, 'ТОП Пушкино', 'Иван Марфицын', 15
  UNION ALL SELECT '2025-06-29'::date, 'ТОП Беляево', 'Алиса', 1
  UNION ALL SELECT '2025-06-29'::date, 'ТОП Перово Академия', 'Ярослав Демкин', 9
  UNION ALL SELECT '2025-07-01'::date, 'ТОП Академическая', 'Диана Гумерова', 11
  UNION ALL SELECT '2025-07-02'::date, 'ТОП Академическая', 'Диана Гумерова', 25
  UNION ALL SELECT '2025-07-02'::date, 'ТОП Академическая', 'Иван Науменко', 5
  UNION ALL SELECT '2025-07-02'::date, 'ТОП Академическая', 'Мария', 6
  UNION ALL SELECT '2025-07-02'::date, 'ТОП Академическая', 'Вероника Тарасова', 6
  UNION ALL SELECT '2025-07-02'::date, 'ТОП Академическая', 'Денис', 2
  UNION ALL SELECT '2025-07-03'::date, 'ТОП Беляево', 'Диана Гумерова', 39
  UNION ALL SELECT '2025-07-03'::date, 'ТОП Беляево', 'Ярослав Демкин', 13
  UNION ALL SELECT '2025-07-03'::date, 'ТОП Беляево', 'Мария 5808', 1
  UNION ALL SELECT '2025-07-03'::date, 'ТОП Беляево', 'Вероника Тарасова', 3
  UNION ALL SELECT '2025-07-03'::date, 'ТОП Беляево', 'Денис', 1
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