
-- Создаем 2 корректировочные смены
INSERT INTO t_p24058207_website_creation_pro.work_shifts 
(user_id, organization_id, shift_date, shift_start, shift_end, created_at)
VALUES 
  (6839, 171, '2025-01-02', '2025-01-02 00:00:00+00'::timestamptz, '2025-01-02 00:00:01+00'::timestamptz, NOW()),
  (6839, 172, '2025-01-03', '2025-01-03 00:00:00+00'::timestamptz, '2025-01-03 00:00:01+00'::timestamptz, NOW());

-- Создаем записи в accounting_expenses
INSERT INTO t_p24058207_website_creation_pro.accounting_expenses 
(user_id, organization_id, work_date, expense_amount, expense_comment, paid_by_organization, paid_to_worker, salary_at_kvv, paid_kvv, paid_kms, invoice_issued, invoice_paid)
VALUES 
  (6839, 171, '2025-01-02', 0, 'Корректировка безнал', true, true, false, true, true, false, false),
  (6839, 172, '2025-01-03', 0, 'Корректировка нал', true, true, false, true, true, false, false);
  
-- Добавляем по 1 контакту для каждой корректировочной смены
INSERT INTO t_p24058207_website_creation_pro.leads_analytics 
(user_id, organization_id, lead_type, lead_result, is_active, created_at)
VALUES 
  (6839, 171, 'контакт', 'neutral', true, '2025-01-02 00:00:00'::timestamp),
  (6839, 172, 'контакт', 'neutral', true, '2025-01-03 00:00:00'::timestamp);

-- Создаем видео-метки открытия/закрытия смен
INSERT INTO t_p24058207_website_creation_pro.shift_videos 
(user_id, work_date, video_type, created_at, organization_id)
VALUES 
  (6839, '2025-01-02', 'start', '2025-01-02 00:00:00+00'::timestamptz, 171),
  (6839, '2025-01-02', 'end', '2025-01-02 00:00:01+00'::timestamptz, 171),
  (6839, '2025-01-03', 'start', '2025-01-03 00:00:00+00'::timestamptz, 172),
  (6839, '2025-01-03', 'end', '2025-01-03 00:00:01+00'::timestamptz, 172);
