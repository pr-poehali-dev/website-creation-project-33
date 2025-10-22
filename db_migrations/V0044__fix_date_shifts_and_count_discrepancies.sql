-- Исправление сдвигов по датам и расхождений по количеству

-- 1. Удаляем лишний контакт: Владислава Долматова, ТОП Коломенская, 15.10
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET is_active = false 
WHERE id = 589;

-- 2. Удаляем один лишний контакт: Даниил Слепченко, Сотка, 16.10 (последний по времени)
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET is_active = false 
WHERE id = 616;

-- 3. Сдвигаем дату на 1 день вперёд (02.10): Диана Гумерова, Сотка (2 контакта)
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET created_at = created_at + interval '1 day'
WHERE id IN (127, 129);

-- 4. Сдвигаем дату на 1 день вперёд (02.10): Владислава Долматова, Сотка (3 контакта)
UPDATE t_p24058207_website_creation_pro.leads_analytics 
SET created_at = created_at + interval '1 day'
WHERE id IN (130, 131, 132);