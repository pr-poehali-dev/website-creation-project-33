-- Перенос данных Сергея Сливко из архивного аккаунта (6686) в активный (6844)

-- 1. Обновляем лиды (контакты)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET user_id = 6844
WHERE user_id = 6686;

-- 2. Обновляем смены
UPDATE t_p24058207_website_creation_pro.work_shifts
SET user_id = 6844
WHERE user_id = 6686;

-- 3. Обновляем расписание (если есть)
UPDATE t_p24058207_website_creation_pro.promoter_schedules
SET user_id = 6844
WHERE user_id = 6686;
