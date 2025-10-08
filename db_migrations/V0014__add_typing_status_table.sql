CREATE TABLE IF NOT EXISTS t_p24058207_website_creation_pro.typing_status (
    user_id INTEGER PRIMARY KEY,
    is_typing BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);