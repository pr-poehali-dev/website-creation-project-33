-- Обновляем даты контактов Ольги Салтыковой с 2024 на 2025 год

UPDATE leads_analytics 
SET created_at = created_at + INTERVAL '1 year' 
WHERE user_id = 42 
  AND created_at >= '2024-10-03 00:00:00+00' 
  AND created_at <= '2024-10-14 23:59:59+00';