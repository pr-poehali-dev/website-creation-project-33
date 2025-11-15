
-- Создаем 2 корректировочные организации: безнал и нал
INSERT INTO t_p24058207_website_creation_pro.organizations (name, contact_rate, payment_type, created_at)
VALUES 
  ('Корректировка (безнал)', -1369532, 'cashless', NOW()),
  ('Корректировка (нал)', 1264838, 'cash', NOW())
ON CONFLICT (name) DO NOTHING;
