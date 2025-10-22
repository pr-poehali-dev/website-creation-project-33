-- Деактивация дублирующихся записей (оставляем нужное количество активными)

-- 29.09.2025 - Ольга Салтыкова (деактивировать 15 из 20, оставить 5)
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET is_active = false 
WHERE id IN (
    SELECT id FROM t_p24058207_website_creation_pro.leads_analytics 
    WHERE user_id = 42 AND organization_id = 1 AND created_at::date = '2025-09-29'
    ORDER BY id DESC 
    LIMIT 15
);

-- 29.09.2025 - Владислава Долматова (деактивировать 15 из 20, оставить 5)
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET is_active = false 
WHERE id IN (
    SELECT id FROM t_p24058207_website_creation_pro.leads_analytics 
    WHERE user_id = 7 AND organization_id = 1 AND created_at::date = '2025-09-29'
    ORDER BY id DESC 
    LIMIT 15
);

-- 29.09.2025 - Кристина Маркаускайте (деактивировать 10 из 15, оставить 5)
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET is_active = false 
WHERE id IN (
    SELECT id FROM t_p24058207_website_creation_pro.leads_analytics 
    WHERE user_id = 8 AND organization_id = 21 AND created_at::date = '2025-09-29'
    ORDER BY id DESC 
    LIMIT 10
);

-- 04.10.2025 - Артём Сушко (деактивировать 2 из 4, оставить 2)
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET is_active = false 
WHERE id IN (
    SELECT id FROM t_p24058207_website_creation_pro.leads_analytics 
    WHERE user_id = 59 AND organization_id = 1 AND created_at::date = '2025-10-04'
    ORDER BY id DESC 
    LIMIT 2
);

-- 06.10.2025 - Кристина Маркаускайте Бабушкинская (деактивировать 4 из 8, оставить 4)
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET is_active = false 
WHERE id IN (
    SELECT id FROM t_p24058207_website_creation_pro.leads_analytics 
    WHERE user_id = 8 AND organization_id = 3 AND created_at::date = '2025-10-06'
    ORDER BY id DESC 
    LIMIT 4
);

-- 11.10.2025 - Владислава Долматова Тушинская (деактивировать 8 из 16, оставить 8)
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET is_active = false 
WHERE id IN (
    SELECT id FROM t_p24058207_website_creation_pro.leads_analytics 
    WHERE user_id = 7 AND organization_id = 15 AND created_at::date = '2025-10-11'
    ORDER BY id DESC 
    LIMIT 8
);

-- 20.10.2025 - Анастасия Войнова (деактивировать 3 из 6, оставить 3)
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET is_active = false 
WHERE id IN (
    SELECT id FROM t_p24058207_website_creation_pro.leads_analytics 
    WHERE user_id = 49 AND organization_id = 1 AND created_at::date = '2025-10-20'
    ORDER BY id DESC 
    LIMIT 3
);