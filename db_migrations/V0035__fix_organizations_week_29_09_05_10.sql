-- Обновление организаций для контактов за неделю 29.09-05.10

-- Кристина Маркаускайте - 12 контактов KIBERONE (Деловой центр)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = 2
WHERE id IN (145, 146, 153, 162, 166, 168, 177, 181, 183, 187, 189, 191);

-- Владислава Долматова - 3 контакта (Сотка)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = 1
WHERE id IN (130, 131, 132);

-- Владислава Долматова - 15 контактов KIBERONE (Деловой центр)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = 2
WHERE id IN (140, 142, 144, 151, 155, 165, 170, 173, 176, 178, 180, 184, 185, 186, 190);

-- Ольга Алексеева - 12 контактов ТОП (Речной Вокзал)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = 8
WHERE id IN (29, 38, 57, 59, 84, 85, 88, 94, 95, 96, 112, 125);

-- Диана Гумерова - 2 контакта (Сотка)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = 1
WHERE id IN (127, 129);
