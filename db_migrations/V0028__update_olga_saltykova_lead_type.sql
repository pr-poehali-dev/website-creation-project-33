-- Обновляем lead_type с 'contact' на 'контакт' для записей Ольги Салтыковой за 20.10.2025
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET lead_type = 'контакт'
WHERE user_id = 42 
  AND lead_type = 'contact' 
  AND DATE(created_at) = '2025-10-20';
