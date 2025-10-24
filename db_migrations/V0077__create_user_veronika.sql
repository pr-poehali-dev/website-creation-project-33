-- Создаем пользователя "Вероника" для первой записи списка
INSERT INTO t_p24058207_website_creation_pro.users 
  (email, password_hash, name, is_admin, is_approved, is_active, created_at)
VALUES 
  ('veronika_promoter@temporary.local', 'no_password_hash', 'Вероника', false, true, true, NOW())
ON CONFLICT DO NOTHING;