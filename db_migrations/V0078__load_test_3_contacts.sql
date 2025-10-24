-- Тестовая загрузка 3 контактов для проверки
INSERT INTO t_p24058207_website_creation_pro.leads_analytics 
  (user_id, organization_id, lead_type, lead_result, is_active, created_at)
SELECT 
  (SELECT id FROM t_p24058207_website_creation_pro.users WHERE name = 'Вероника' LIMIT 1),
  (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'Кид Форс Выхино' LIMIT 1),
  'контакт',
  '',
  true,
  '2025-03-14 21:00:00'::timestamp
FROM generate_series(1, 3);