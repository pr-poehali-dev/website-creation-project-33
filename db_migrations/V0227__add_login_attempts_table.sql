CREATE TABLE IF NOT EXISTS t_p24058207_website_creation_pro.login_attempts (
    id SERIAL PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL,
    email VARCHAR(255),
    attempted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    success BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_ip ON t_p24058207_website_creation_pro.login_attempts(ip_address, attempted_at);
