-- Создаем второго администратора
INSERT INTO t_p24058207_website_creation_pro.users (
    email, 
    password_hash, 
    name, 
    is_admin, 
    is_approved, 
    is_active,
    telegram_chat_id,
    created_at
) VALUES (
    'adminv@gmail.com',
    '$2b$10$rHj5YQv3qX0FZ9/8mKx5.eqX7YqZ8mKx5.eqX7YqZ8mKx5.eqX7YqZ',
    'Administrator V',
    true,
    true,
    true,
    '1526249125',
    NOW()
);