-- Перенос лидов с дубликата организации ID 165 на основную ID 6
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = 6
WHERE organization_id = 165;

-- Перенос видео смен
UPDATE t_p24058207_website_creation_pro.shift_videos
SET organization_id = 6
WHERE organization_id = 165;

-- Обновление выбранной организации у пользователей
UPDATE t_p24058207_website_creation_pro.users
SET selected_organization_id = 6
WHERE selected_organization_id = 165