-- Устанавливаем точное количество контактов согласно эталонной таблице
-- Стратегия: для каждой комбинации (дата, организация, промоутер) оставляем ровно N записей, остальные деактивируем

-- Шаг 1: Деактивируем ВСЕ контакты
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE lead_type = 'контакт'
  AND created_at >= '2025-03-14'
  AND created_at < '2025-10-25';

-- Шаг 2: Активируем нужное количество для каждой строки из эталона
-- (Используем CTE с ROW_NUMBER для точного контроля количества)

WITH target_counts AS (
  -- Эталонные данные из CSV
  SELECT '2025-03-15'::date as date, 'Кид Форс Выхино' as org, 'Вероника' as promoter, 3 as count
  UNION ALL SELECT '2025-03-18'::date, 'ШИЯ Солнцево', 'Арсен', 15
  UNION ALL SELECT '2025-03-22'::date, 'Воркаут Царицыно', 'Наталия', 4
  UNION ALL SELECT '2025-03-23'::date, 'ШИЯ Солнцево', 'Арсен', 5
  UNION ALL SELECT '2025-03-26'::date, 'ШИЯ Солнцево', 'Влад', 10
  UNION ALL SELECT '2025-03-26'::date, 'ШИЯ Солнцево', 'Злата', 9
  UNION ALL SELECT '2025-03-28'::date, 'Топ Беляево', 'Марина', 7
  UNION ALL SELECT '2025-03-28'::date, 'Воркаут Царицыно', 'Дмитрий', 5
  UNION ALL SELECT '2025-03-29'::date, 'Худ.гимн. Люблино', 'Александр', 19
  UNION ALL SELECT '2025-03-31'::date, 'ШИЯ Солнцево', 'Влад', 17
  UNION ALL SELECT '2025-03-31'::date, 'ШИЯ Солнцево', 'Злата', 26
  UNION ALL SELECT '2025-03-31'::date, 'Худ.Гимн. Люблино', 'Александр', 16
  UNION ALL SELECT '2025-03-31'::date, 'ШИЯ Солнцево', 'Дима', 2
  UNION ALL SELECT '2025-04-02'::date, 'Худ.Гимн. Люблино', 'Александр', 4
  UNION ALL SELECT '2025-04-03'::date, 'Топ Академическая', 'Злата', 2
  UNION ALL SELECT '2025-04-03'::date, 'Худ.Гимн Люблино', 'Александр', 5
  UNION ALL SELECT '2025-04-04'::date, 'ШИЯ Кузьминки', 'Владимир', 2
  UNION ALL SELECT '2025-04-04'::date, 'ШИЯ Кузьминки', 'Евгения', 5
  UNION ALL SELECT '2025-04-05'::date, 'ШИЯ Солнцево', 'Жаркынай', 5
  UNION ALL SELECT '2025-04-07'::date, 'Левита Жулебино', 'Тихон', 9
  UNION ALL SELECT '2025-04-07'::date, 'Левита Жулебино', 'Артём', 1
  UNION ALL SELECT '2025-04-07'::date, 'Левита Жулебино', 'Дмитрий', 1
  UNION ALL SELECT '2025-04-07'::date, 'Топ Беляево', 'Марина', 6
  UNION ALL SELECT '2025-04-08'::date, 'Топ Беляево', 'Марина', 5
  UNION ALL SELECT '2025-04-08'::date, 'ШИЯ Солнцево', 'Марк', 2
  UNION ALL SELECT '2025-04-08'::date, 'ШИЯ Солнцево', 'Элина', 5
  UNION ALL SELECT '2025-04-08'::date, 'ШИЯ Солнцево', 'Людмила', 11
  UNION ALL SELECT '2025-04-08'::date, 'ШИЯ Солнцево', 'Татьяна', 4
  UNION ALL SELECT '2025-04-09'::date, 'ШИЯ Стахановская', 'Марк', 2
  UNION ALL SELECT '2025-04-09'::date, 'ШИЯ Стахановская', 'Николай Савр', 14
  UNION ALL SELECT '2025-04-09'::date, 'ШИЯ Стахановская', 'Софья', 6
  UNION ALL SELECT '2025-04-09'::date, 'ШИЯ Стахановская', 'Руслан', 22
  UNION ALL SELECT '2025-04-09'::date, 'ШИЯ Стахановская', 'Александр', 11
  UNION ALL SELECT '2025-04-09'::date, 'ШИЯ Стахановская', 'Алексей', 12
  UNION ALL SELECT '2025-04-10'::date, 'ТОП Академическая', 'Константин', 4
  UNION ALL SELECT '2025-04-10'::date, 'ТОП Академическая', 'Иван', 2
  UNION ALL SELECT '2025-04-10'::date, 'ТОП Академическая', 'Дмитрий', 1
  UNION ALL SELECT '2025-04-13'::date, 'ТОП Академическая', 'Амина', 16
  UNION ALL SELECT '2025-04-14'::date, 'ТОП Беляево', 'Амина', 12
  UNION ALL SELECT '2025-04-16'::date, 'ТОП Беляево', 'Амина', 12
  UNION ALL SELECT '2025-04-17'::date, 'ТОП Академическая', 'Амина', 10
  UNION ALL SELECT '2025-04-20'::date, 'ТОП Академическая', 'Софья', 15
  UNION ALL SELECT '2025-04-23'::date, 'ШИЯ Солнцево', 'Амина', 12
  UNION ALL SELECT '2025-05-26'::date, 'ТОП Академическая', 'Александра', 15
  UNION ALL SELECT '2025-05-26'::date, 'ТОП Академическая', 'Анастасия', 11
  UNION ALL SELECT '2025-05-26'::date, 'ТОП Академическая', 'Александр', 5
  UNION ALL SELECT '2025-05-28'::date, 'ТОП Академическая', 'Денис', 5
  UNION ALL SELECT '2025-05-28'::date, 'ТОП Академическая', 'Данила', 10
  UNION ALL SELECT '2025-05-28'::date, 'ТОП Академическая', 'Анастасия', 21
  UNION ALL SELECT '2025-05-28'::date, 'ТОП Беляево', 'Василий', 1
  UNION ALL SELECT '2025-05-28'::date, 'ТОП Беляево', 'Данила', 10
  UNION ALL SELECT '2025-05-28'::date, 'ТОП Беляево', 'Анастасия', 10
  UNION ALL SELECT '2025-05-28'::date, 'ТОП Беляево', 'Денис', 1
  UNION ALL SELECT '2025-05-29'::date, 'ТОП Севастопольская', 'Александра', 3
  UNION ALL SELECT '2025-05-29'::date, 'ТОП Севастопольская', 'Михаил', 10
  UNION ALL SELECT '2025-05-29'::date, 'ТОП Севастопольская', 'Василий', 4
  UNION ALL SELECT '2025-05-29'::date, 'ТОП Севастопольская', 'Сергей', 4
  UNION ALL SELECT '2025-05-29'::date, 'ТОП Севастопольская', 'Артём', 1
  UNION ALL SELECT '2025-05-30'::date, 'ТОП Домодедовская', 'Артём', 3
  UNION ALL SELECT '2025-05-30'::date, 'ТОП Беляево', 'Анастасия', 10
  UNION ALL SELECT '2025-05-30'::date, 'ТОП Беляево', 'Александра', 10
  UNION ALL SELECT '2025-05-30'::date, 'ТОП Беляево', 'Михаил', 11
  UNION ALL SELECT '2025-05-30'::date, 'ТОП Наро-Фоминск', 'Михаил', 10
  UNION ALL SELECT '2025-05-30'::date, 'Воркаут Царицыно', 'Артём', 5
  UNION ALL SELECT '2025-05-30'::date, 'Воркаут Царицыно', 'Никита', 6
  UNION ALL SELECT '2025-06-01'::date, 'Воркаут Царицыно', 'Артём', 5
  UNION ALL SELECT '2025-06-01'::date, 'ТОП Севастопольская', 'Анастасия', 9
  UNION ALL SELECT '2025-06-01'::date, 'Воркаут Царицыно', 'Артём', 5
  UNION ALL SELECT '2025-06-02'::date, 'Воркаут Царицыно', 'Сергей', 13
  UNION ALL SELECT '2025-06-02'::date, 'Воркаут Царицыно', 'Ярослав Демкин', 13
  UNION ALL SELECT '2025-06-02'::date, 'Воркаут Царицыно', 'Иван', 8
  UNION ALL SELECT '2025-06-02'::date, 'Воркаут Царицыно', 'Амир', 8
  UNION ALL SELECT '2025-06-02'::date, 'ТОП Севастопольская', 'Никита', 15
  UNION ALL SELECT '2025-06-02'::date, 'ТОП Севастопольская', 'Анастасия', 1
  UNION ALL SELECT '2025-06-04'::date, 'ТОП Беляево', 'Дамир', 17
  UNION ALL SELECT '2025-06-04'::date, 'ТОП Беляево', 'Анастасия', 13
  UNION ALL SELECT '2025-06-04'::date, 'ТОП Беляево', 'Артём', 6
  UNION ALL SELECT '2025-06-04'::date, 'ТОП Бибирево', 'Александра, Владислав, Максим, Андрей, Ноэль', 29
  UNION ALL SELECT '2025-06-04'::date, 'ТОП Домодедовская', 'Дамир', 22
  UNION ALL SELECT '2025-06-04'::date, 'ТОП Академическая', 'Ярослав Демкин', 15
  UNION ALL SELECT '2025-06-04'::date, 'ТОП Академическая', 'Артём', 1
  UNION ALL SELECT '2025-06-04'::date, 'ТОП Академическая', 'Амир', 15
  UNION ALL SELECT '2025-06-04'::date, 'ТОП Академическая', 'Иван', 4
  UNION ALL SELECT '2025-06-04'::date, 'ТОП Академическая', 'Михаил', 7
  UNION ALL SELECT '2025-06-05'::date, 'ТОП Домодедовская', 'Дамир', 26
  UNION ALL SELECT '2025-06-06'::date, 'ТОП Мытищи', 'Виктория', 2
  UNION ALL SELECT '2025-06-06'::date, 'ТОП Мытищи', 'Анна', 2
  UNION ALL SELECT '2025-06-06'::date, 'ТОП Севастопольская', 'Ярослав Демкин', 15
  UNION ALL SELECT '2025-06-06'::date, 'ТОП Севастопольская', 'Сергей', 4
  UNION ALL SELECT '2025-06-06'::date, 'ТОП Севастопольская', 'Артём', 4
  UNION ALL SELECT '2025-06-06'::date, 'ТОП Севастопольская', 'Иван', 5
  UNION ALL SELECT '2025-06-06'::date, 'ТОП Севастопольская', 'Михаил Г', 13
  UNION ALL SELECT '2025-06-06'::date, 'Воркаут Царицыно', 'Михаил Г', 11
  UNION ALL SELECT '2025-06-06'::date, 'Воркаут Царицыно', 'Ярослав Демкин', 11
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