
-- Проблема: сейчас 100 контактов дают зарплату -20,000₽, а нужно -200₽
-- Решение: оставить только 1 контакт
-- Приход: 1 * (-1047) = -1,047₽ (нужно примерно -104,694₽)
-- 
-- Новая ставка для 1 контакта: -104,694₽
-- Налог: -104,694 * 0.07 = -7,328.58₽
-- Зарплата: 1 * 200 = 200₽ ✓

-- Обновляем ставку для точной корректировки
UPDATE t_p24058207_website_creation_pro.organizations 
SET contact_rate = -104694
WHERE name = 'Корректировка';

-- Обновляем количество активных лидов (помечаем лишние как неактивные)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET is_active = false
WHERE user_id = 6839 
  AND organization_id = 169 
  AND id NOT IN (
    SELECT id 
    FROM t_p24058207_website_creation_pro.leads_analytics 
    WHERE user_id = 6839 AND organization_id = 169
    ORDER BY created_at 
    LIMIT 1
  );
