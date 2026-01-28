-- Обновление ставки KIBERONE (Железнодорожный) с 600 до 750
UPDATE t_p24058207_website_creation_pro.organizations 
SET contact_rate = 750, updated_at = CURRENT_TIMESTAMP
WHERE id = 59 AND name = 'KIBERONE (Железнодорожный)';