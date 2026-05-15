-- Убираем лишнюю запись ТОП Перово 15.05 для Ирины Миморовой: обнуляем все суммы
UPDATE t_p24058207_website_creation_pro.accounting_expenses 
SET expense_amount = 0,
    compensation_amount = 0,
    paid_by_organization = false,
    paid_to_worker = false,
    employee_status_at_shift = 'removed'
WHERE id = 1875;