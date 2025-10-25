-- Добавление оставшихся 6 недостающих контактов за июнь

-- Исправление: 06.06.2025 нужно 54 контакта (26+2+2+15+4+4+1=54), в базе 67 - избыток
-- 07.06.2025 нужно 62 (27+12+12+1+10+7=69), в базе 51 - не хватает 18

-- 07.06.2025 13:21:40 ТОП Беляево Артём 1
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6712, o.id, 'контакт', 'положительный', '2025-06-07 10:21:40'::timestamp, true
FROM t_p24058207_website_creation_pro.organizations o
WHERE o.name = 'ТОП (Беляево)';

-- 07.06.2025 13:21:40 ТОП Беляево Михаил 10
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6764, o.id, 'контакт', 'положительный', '2025-06-07 10:21:40'::timestamp + (n || ' seconds')::interval, true
FROM t_p24058207_website_creation_pro.organizations o, generate_series(0, 9) n
WHERE o.name = 'ТОП (Беляево)';

-- 07.06.2025 13:21:40 ТОП Беляево Анастасия 7
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at, is_active)
SELECT 6742, o.id, 'контакт', 'положительный', '2025-06-07 10:21:50'::timestamp + (n || ' seconds')::interval, true
FROM t_p24058207_website_creation_pro.organizations o, generate_series(0, 6) n
WHERE o.name = 'ТОП (Беляево)';