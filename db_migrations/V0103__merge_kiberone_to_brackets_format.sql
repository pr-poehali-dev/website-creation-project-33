-- Перенос контактов из КиберВан В KIBERONE со скобками
-- Правильный формат: KIBERONE (Бибирево) - оставляем
-- Неправильный формат: КиберВан Биберево - удаляем после переноса

-- 1. КиберВан Бабушкинкая (4) -> KIBERONE (Бабушкинская)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'KIBERONE (Бабушкинская)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'КиберВан Бабушкинкая');

-- 2. КиберВан Биберево (57) -> KIBERONE (Бибирево)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'KIBERONE (Бибирево)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'КиберВан Биберево');

-- 3. КиберВан Деловой Центр (49) -> KIBERONE (Деловой Центр)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'KIBERONE (Деловой Центр)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'КиберВан Деловой Центр');

-- 4. КиберВан Электросталь (131) -> KIBERONE (Электросталь)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'KIBERONE (Электросталь)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'КиберВан Электросталь');