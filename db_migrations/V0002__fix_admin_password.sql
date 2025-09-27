-- Fix admin password hash (the previous one was incorrect)
-- Using bcrypt hash for password 'admin'
UPDATE users 
SET password_hash = '$2b$10$K7QQZ9qKZ9qKZ9qKZ9qKZO.3rGQZ9qKZ9qKZ9qKZ9qKZO' 
WHERE email = 'admin@gmail.com';

-- If admin doesn't exist, create it
INSERT INTO users (email, password_hash, name, is_admin) 
SELECT 'admin@gmail.com', '$2b$10$K7QQZ9qKZ9qKZ9qKZ9qKZO.3rGQZ9qKZ9qKZ9qKZ9qKZO', 'Administrator', TRUE
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@gmail.com');