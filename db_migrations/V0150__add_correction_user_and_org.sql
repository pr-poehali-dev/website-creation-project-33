
-- Создаем специального пользователя "Корректировка" если его нет
INSERT INTO t_p24058207_website_creation_pro.users (email, password_hash, name, is_admin, is_active, is_approved, created_at)
VALUES ('correction@system.local', 'SYSTEM_CORRECTION_USER', 'Корректировка', false, true, true, NOW())
ON CONFLICT (email) DO NOTHING;

-- Создаем специальную организацию "Корректировка" если её нет  
INSERT INTO t_p24058207_website_creation_pro.organizations (name, contact_rate, payment_type, created_at)
VALUES ('Корректировка', 1047, 'cashless', NOW())
ON CONFLICT (name) DO NOTHING;
