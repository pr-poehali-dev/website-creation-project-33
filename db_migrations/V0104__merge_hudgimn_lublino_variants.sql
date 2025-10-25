-- Объединение всех вариантов написания "Худ.Гимн. Люблино" в ID 28
-- Правильный формат: Худ.Гимн. Люблино (ID: 28) - оставляем
-- Неправильные форматы: удаляем после переноса

-- 1. Худ.Гимн Люблино (ID: 152, 5 контактов) -> Худ.Гимн. Люблино (ID: 28)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = 28
WHERE organization_id = 152;

-- 2. Худ.гимн. Люблино (ID: 150, 19 контактов) -> Худ.Гимн. Люблино (ID: 28)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = 28
WHERE organization_id = 150;