-- Добавляем поле для хранения статуса сотрудника на момент смены
ALTER TABLE t_p24058207_website_creation_pro.accounting_expenses
  ADD COLUMN IF NOT EXISTS employee_status_at_shift VARCHAR(20) NULL;

-- Для всех существующих смен до 08.05.2026 — сотрудник
UPDATE t_p24058207_website_creation_pro.accounting_expenses ae
SET employee_status_at_shift = 'employee'
WHERE work_date < '2026-05-08';

-- Для смен с 08.05.2026 берём текущий статус из users
UPDATE t_p24058207_website_creation_pro.accounting_expenses ae
SET employee_status_at_shift = u.employee_status
FROM t_p24058207_website_creation_pro.users u
WHERE ae.user_id = u.id
  AND ae.work_date >= '2026-05-08'
  AND ae.employee_status_at_shift IS NULL;

-- Для тех у кого нет записи в accounting_expenses (NULL остались) — employee по умолчанию
UPDATE t_p24058207_website_creation_pro.accounting_expenses
SET employee_status_at_shift = 'employee'
WHERE employee_status_at_shift IS NULL;
