-- Фиксируем employee_status_at_shift для всех NULL записей.
-- Логика: определяем порядковый номер смены среди ВСЕХ смен пользователя (по дате).
-- Первые 3 = intern, с 4-й и далее = employee.
UPDATE t_p24058207_website_creation_pro.accounting_expenses ae
SET employee_status_at_shift = CASE
    WHEN ranked.shift_order <= 3 THEN 'intern'
    ELSE 'employee'
END
FROM (
    SELECT 
        id,
        ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY work_date, organization_id) as shift_order
    FROM t_p24058207_website_creation_pro.accounting_expenses
    WHERE user_id IN (
        SELECT DISTINCT user_id FROM t_p24058207_website_creation_pro.accounting_expenses WHERE employee_status_at_shift IS NULL
    )
) ranked
WHERE ae.id = ranked.id AND ae.employee_status_at_shift IS NULL;