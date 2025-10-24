-- Пересоздаем удаленные организации КиберВан для архива

INSERT INTO t_p24058207_website_creation_pro.organizations (id, name) 
VALUES 
  (50, 'КиберВан Электросталь'),
  (74, 'КиберВан Биберево'),
  (77, 'КиберВан Деловой Центр'),
  (78, 'КиберВан Бабушкинкая')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

-- Возвращаем данные архива обратно в КиберВан организации
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 74 
WHERE organization_id = 10;

UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 77 
WHERE organization_id = 2;

UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 50 
WHERE organization_id = 9;

UPDATE t_p24058207_website_creation_pro.archive_leads_analytics 
SET organization_id = 78 
WHERE organization_id = 3;