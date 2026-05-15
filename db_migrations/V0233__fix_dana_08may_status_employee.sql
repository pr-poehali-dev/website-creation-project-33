-- Дана Горбунова: смена 08.05 ТОП Реутов — исправляем с intern на employee,
-- так как первая смена была 07.05 (до cutoff 08.05.2026)
UPDATE t_p24058207_website_creation_pro.accounting_expenses
SET employee_status_at_shift = 'employee'
WHERE user_id = 6922 AND work_date = '2026-05-08' AND organization_id = 18;