CREATE TABLE IF NOT EXISTS t_p24058207_website_creation_pro.cancelled_fines (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    fine_date DATE NOT NULL,
    fine_type VARCHAR(20) NOT NULL,
    fine_slot VARCHAR(20),
    amount INTEGER NOT NULL DEFAULT 0,
    cancelled_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, fine_date, fine_type, fine_slot)
);