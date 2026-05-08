-- Добавляем статус сотрудника: 'intern' (стажёр) или 'employee' (сотрудник)
-- Пользователи, зарегистрированные до 08.05.2026 — сразу 'employee'
-- Пользователи с 08.05.2026 — 'intern' по умолчанию
ALTER TABLE t_p24058207_website_creation_pro.users
  ADD COLUMN IF NOT EXISTS employee_status VARCHAR(20) NOT NULL DEFAULT 'employee';

ALTER TABLE t_p24058207_website_creation_pro.users
  ADD COLUMN IF NOT EXISTS internship_shifts_completed INTEGER NOT NULL DEFAULT 0;

-- Все существующие пользователи (до 08.05.2026) получают статус 'employee'
UPDATE t_p24058207_website_creation_pro.users
SET employee_status = 'employee',
    internship_shifts_completed = 3
WHERE DATE(created_at AT TIME ZONE 'Europe/Moscow') < '2026-05-08';

-- Новые пользователи (08.05.2026 и позже) получают статус 'intern'
UPDATE t_p24058207_website_creation_pro.users
SET employee_status = 'intern',
    internship_shifts_completed = 0
WHERE DATE(created_at AT TIME ZONE 'Europe/Moscow') >= '2026-05-08';
