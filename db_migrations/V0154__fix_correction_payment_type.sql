
-- Меняем тип оплаты корректировочной организации на наличные
-- чтобы избежать налогообложения при корректировке
UPDATE t_p24058207_website_creation_pro.organizations 
SET payment_type = 'cash',
    contact_rate = -104694
WHERE name = 'Корректировка';
