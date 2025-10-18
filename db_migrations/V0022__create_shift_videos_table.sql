-- Создать таблицу для хранения информации о видео открытия и закрытия смен
CREATE TABLE IF NOT EXISTS t_p24058207_website_creation_pro.shift_videos (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES t_p24058207_website_creation_pro.users(id),
    organization_id INTEGER NOT NULL REFERENCES t_p24058207_website_creation_pro.organizations(id),
    video_type VARCHAR(10) NOT NULL CHECK (video_type IN ('start', 'end')),
    telegram_message_id BIGINT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    work_date DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE INDEX IF NOT EXISTS idx_shift_videos_user_date ON t_p24058207_website_creation_pro.shift_videos(user_id, work_date);
CREATE INDEX IF NOT EXISTS idx_shift_videos_organization ON t_p24058207_website_creation_pro.shift_videos(organization_id);