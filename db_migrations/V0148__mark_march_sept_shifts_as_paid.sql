
-- Проставляем все галочки оплат для смен март-сентябрь 2025
-- Обновляем записи в accounting_expenses или создаем их если не существуют

INSERT INTO t_p24058207_website_creation_pro.accounting_expenses 
    (user_id, work_date, organization_id, expense_amount, expense_comment, 
     paid_by_organization, paid_to_worker, paid_kvv, paid_kms, 
     invoice_issued, created_at, updated_at)
SELECT 
    ws.user_id,
    ws.shift_date as work_date,
    ws.organization_id,
    0 as expense_amount,
    '' as expense_comment,
    true as paid_by_organization,
    true as paid_to_worker,
    true as paid_kvv,
    true as paid_kms,
    false as invoice_issued,
    NOW() as created_at,
    NOW() as updated_at
FROM t_p24058207_website_creation_pro.work_shifts ws
WHERE ws.shift_date >= '2025-03-01' 
    AND ws.shift_date < '2025-10-01'
    AND NOT EXISTS (
        SELECT 1 FROM t_p24058207_website_creation_pro.accounting_expenses ae
        WHERE ae.user_id = ws.user_id 
            AND ae.work_date = ws.shift_date
            AND ae.organization_id = ws.organization_id
    )
ON CONFLICT (user_id, work_date, organization_id) 
DO UPDATE SET
    paid_by_organization = true,
    paid_to_worker = true,
    paid_kvv = true,
    paid_kms = true,
    updated_at = NOW();

-- Обновляем существующие записи
UPDATE t_p24058207_website_creation_pro.accounting_expenses
SET 
    paid_by_organization = true,
    paid_to_worker = true,
    paid_kvv = true,
    paid_kms = true,
    updated_at = NOW()
WHERE work_date >= '2025-03-01' 
    AND work_date < '2025-10-01';
