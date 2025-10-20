-- Добавляем 12 контактов для Ольги Салтыковой за 20.10.2025 (смена 10:00-20:00)
-- user_id = 42, organization_id = 4 (ТОП Коломенская)

INSERT INTO t_p24058207_website_creation_pro.leads_analytics 
(user_id, lead_type, lead_result, created_at, organization_id, has_audio) 
VALUES
(42, 'contact', 'success', '2025-10-20 10:30:00+00', 4, false),
(42, 'contact', 'success', '2025-10-20 11:15:00+00', 4, false),
(42, 'contact', 'success', '2025-10-20 12:00:00+00', 4, false),
(42, 'contact', 'success', '2025-10-20 13:20:00+00', 4, false),
(42, 'contact', 'success', '2025-10-20 14:10:00+00', 4, false),
(42, 'contact', 'success', '2025-10-20 15:00:00+00', 4, false),
(42, 'contact', 'success', '2025-10-20 15:45:00+00', 4, false),
(42, 'contact', 'success', '2025-10-20 16:30:00+00', 4, false),
(42, 'contact', 'success', '2025-10-20 17:15:00+00', 4, false),
(42, 'contact', 'success', '2025-10-20 18:00:00+00', 4, false),
(42, 'contact', 'success', '2025-10-20 18:45:00+00', 4, false),
(42, 'contact', 'success', '2025-10-20 19:30:00+00', 4, false);
