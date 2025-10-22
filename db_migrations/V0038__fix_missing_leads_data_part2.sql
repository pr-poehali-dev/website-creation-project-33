-- 4. 04.10 - Артём Сушко, Сотка, 2 контакта
INSERT INTO t_p24058207_website_creation_pro.leads_analytics (user_id, organization_id, lead_type, lead_result, created_at)
VALUES 
(59, 1, 'контакт', 'обработан', '2025-10-04 23:25:17+03:00'),
(59, 1, 'контакт', 'обработан', '2025-10-04 23:25:17+03:00');

-- 5. 06.10 - Кристина Маркаускайте, исправление организации на Бабушкинскую
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET organization_id = 3
WHERE user_id = 8 
  AND created_at >= '2025-10-06 00:00:00+03:00'
  AND created_at < '2025-10-07 00:00:00+03:00'
  AND organization_id = 2;

-- 6. 08.10 - Кристина Маркаускайте, исправление организации на Сотку  
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET organization_id = 1
WHERE user_id = 8 
  AND created_at >= '2025-10-08 00:00:00+03:00'
  AND created_at < '2025-10-09 00:00:00+03:00'
  AND organization_id = 2;