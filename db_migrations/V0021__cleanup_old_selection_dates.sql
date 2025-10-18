-- Очистить старые данные selected_organization_date у пользователей с NULL организацией
UPDATE t_p24058207_website_creation_pro.users 
SET selected_organization_date = NULL
WHERE selected_organization_id IS NULL AND is_admin = FALSE;