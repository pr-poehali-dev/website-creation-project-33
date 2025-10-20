-- Создаем таблицу для учета рабочих смен промоутеров
CREATE TABLE IF NOT EXISTS t_p24058207_website_creation_pro.work_shifts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p24058207_website_creation_pro.users(id),
    organization_id INTEGER NOT NULL REFERENCES t_p24058207_website_creation_pro.organizations(id),
    shift_date DATE NOT NULL,
    shift_start TIMESTAMP WITH TIME ZONE NOT NULL,
    shift_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Создаем индексы для быстрого поиска
CREATE INDEX idx_work_shifts_user_date ON t_p24058207_website_creation_pro.work_shifts(user_id, shift_date);
CREATE INDEX idx_work_shifts_org_date ON t_p24058207_website_creation_pro.work_shifts(organization_id, shift_date);

-- Добавляем смену для Ольги Салтыковой на 20.10.2025
INSERT INTO t_p24058207_website_creation_pro.work_shifts 
(user_id, organization_id, shift_date, shift_start, shift_end, created_at, updated_at)
VALUES 
(42, 4, '2025-10-20', '2025-10-20 12:00:00+03', '2025-10-20 20:00:00+03', now(), now());
