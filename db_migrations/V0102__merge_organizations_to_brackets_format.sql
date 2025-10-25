-- Перенос контактов из организаций БЕЗ скобок В организации СО скобками
-- Правильный формат: ТОП (Академическая) - оставляем
-- Неправильный формат: ТОП Академическая - удаляем после переноса

-- 1. ТОП Академическая (423) -> ТОП (Академическая)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП (Академическая)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП Академическая');

-- 2. Топ Академическая (2) -> ТОП (Академическая)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП (Академическая)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'Топ Академическая');

-- 3. ТОП Беляево (526) -> ТОП (Беляево)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП (Беляево)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП Беляево');

-- 4. Топ Беляево (18) -> ТОП (Беляево)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП (Беляево)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'Топ Беляево');

-- 5. ТОП Воскресенск (182) -> ТОП (Воскресенск)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП (Воскресенск)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП Воскресенск');

-- 6. ТОП Домодедовская (178) -> ТОП (Домодедовская)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП (Домодедовская)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП Домодедовская');

-- 7. ТОП Коломенская (88) -> ТОП (Коломенская)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП (Коломенская)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП Коломенская');

-- 8. ТОП Митино (131) -> ТОП (Митино)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП (Митино)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП Митино');

-- 9. ТОП Ногинск (125) -> ТОП (Ногинск)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП (Ногинск)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП Ногинск');

-- 10. ТОП Перово Академия (174) -> ТОП (Перово)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП (Перово)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП Перово Академия');

-- 11. ТОП Реутов (106) -> ТОП (Реутов)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП (Реутов)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП Реутов');

-- 12. ТОП Речной (269) -> ТОП (Речной Вокзал)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП (Речной Вокзал)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП Речной');

-- 13. ТОП Тушинская (93) -> ТОП (Тушинская)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП (Тушинская)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП Тушинская');

-- 14. ТОП Щелковская (107) -> ТОП (Щелковская)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП (Щелковская)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП Щелковская');

-- 15. ТОП Юго-западная (34) -> ТОП (Юго-Западная)
UPDATE t_p24058207_website_creation_pro.leads_analytics
SET organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП (Юго-Западная)')
WHERE organization_id = (SELECT id FROM t_p24058207_website_creation_pro.organizations WHERE name = 'ТОП Юго-западная');