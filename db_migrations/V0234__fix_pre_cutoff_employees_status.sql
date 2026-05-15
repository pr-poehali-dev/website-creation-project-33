-- Исправляем всех промоутеров, чья первая смена была ДО 08.05.2026:
-- все их смены должны быть employee, стажёрская ставка к ним не применяется
UPDATE t_p24058207_website_creation_pro.accounting_expenses
SET employee_status_at_shift = 'employee'
WHERE employee_status_at_shift = 'intern'
AND user_id IN (
    SELECT user_id
    FROM t_p24058207_website_creation_pro.accounting_expenses
    GROUP BY user_id
    HAVING MIN(work_date) < '2026-05-08'
);