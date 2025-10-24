-- Полный откат слияния КиберВан организаций

-- Шаг 1: Восстанавливаем удаленные КиберВан организации
INSERT INTO t_p24058207_website_creation_pro.organizations (id, name) 
VALUES 
  (50, 'КиберВан Электросталь'),
  (74, 'КиберВан Биберево'),
  (77, 'КиберВан Деловой Центр'),
  (78, 'КиберВан Бабушкинкая')
ON CONFLICT (id) DO NOTHING;

-- Шаг 2: Возвращаем архивные данные обратно в КиберВан организации
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 74 
WHERE organization_id = 10 AND promoter_name = 'Владислава Долматова';

UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 77 
WHERE organization_id = 2 AND promoter_name IN ('Владислава Долматова', 'Кристина Маркаускайте', 'Мирослава Локтева');

UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 50 
WHERE organization_id = 9 AND promoter_name IN ('Андрей Широков', 'Дарья', 'Денис', 'Майя Дзюба', 'Сергей');

UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 78 
WHERE organization_id = 3 AND promoter_name IN ('Корельский Максим', 'Кристина Маркаускайте');