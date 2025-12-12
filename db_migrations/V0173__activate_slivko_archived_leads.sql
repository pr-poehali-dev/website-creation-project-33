-- Активируем все неактивные лиды Сергея Сливко, которые привязаны к подтверждённым сменам

UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = true
WHERE user_id = 6844 
  AND is_active = false
  AND EXISTS (
    SELECT 1 
    FROM t_p24058207_website_creation_pro.work_shifts s
    WHERE s.user_id = leads_analytics.user_id
      AND s.shift_date = leads_analytics.created_at::date
      AND s.organization_id = leads_analytics.organization_id
  );
