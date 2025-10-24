-- Загрузка финальных строк 621-630
WITH source_data AS (
  SELECT * FROM (VALUES
    ('20.10.2025', 'ТОП Коломенская', 'Ольга Салтыкова', 12),
    ('20.10.2025', 'Сотка', 'Кристина Маркаускайте', 14),
    ('20.10.2025', 'Сотка', 'Владислава Долматова', 5),
    ('20.10.2025', 'Сотка', 'Дарья Никиткова', 4),
    ('20.10.2025', 'Сотка', 'Анастасия Войнова', 3),
    ('20.10.2025', 'Сотка', 'Даниил Слепченко', 1),
    ('21.10.2025', 'КиберВан Деловой Центр', 'Мирослава Локтева', 3),
    ('21.10.2025', 'Сотка', 'Даниил Слепченко', 5),
    ('21.10.2025', 'Сотка', 'Владислава Долматова', 5),
    ('22.10.2025', 'Сотка', 'Кристина Маркаускайте', 6),
    ('23.10.2025', 'ТОП Беляево', 'Владислава Долматова', 1),
    ('23.10.2025', 'ТОП Беляево', 'Мария Марченкова', 5),
    ('24.10.2025', 'ТОП Беляево', 'rroza', 3)
  ) AS t(date_str, org_name, user_name, contacts)
)
INSERT INTO t_p24058207_website_creation_pro.leads_analytics 
  (user_id, organization_id, lead_type, lead_result, is_active, created_at)
SELECT 
  u.id,
  o.id,
  'контакт',
  '',
  true,
  TO_TIMESTAMP(sd.date_str, 'DD.MM.YYYY') - INTERVAL '3 hours'
FROM source_data sd
JOIN t_p24058207_website_creation_pro.users u ON u.name = sd.user_name
JOIN t_p24058207_website_creation_pro.organizations o ON o.name = sd.org_name
CROSS JOIN generate_series(1, sd.contacts);