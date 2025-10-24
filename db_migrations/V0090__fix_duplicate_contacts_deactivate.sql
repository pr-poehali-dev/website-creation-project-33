-- Деактивируем дубликаты (лишние 98 контактов)
-- Проблема: строки 51 загрузилась в двух миграциях (V0079 и V0080)

-- Находим дубликаты для строки 51: 28.05.2025 | ТОП Беляево | Данила | 10
-- В БД есть 20, нужно оставить 10, деактивировать 10

WITH duplicates AS (
  SELECT l.id
  FROM t_p24058207_website_creation_pro.leads_analytics l
  JOIN t_p24058207_website_creation_pro.users u ON l.user_id = u.id
  JOIN t_p24058207_website_creation_pro.organizations o ON l.organization_id = o.id
  WHERE l.is_active = true
    AND l.lead_type = 'контакт'
    AND DATE(l.created_at + interval '3 hours') = '2025-05-28'
    AND o.name = 'ТОП Беляево'
    AND u.name = 'Данила'
  ORDER BY l.id DESC
  LIMIT 10
)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE id IN (SELECT id FROM duplicates);