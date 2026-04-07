CREATE TABLE IF NOT EXISTS t_p24058207_website_creation_pro.training_seniors (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p24058207_website_creation_pro.training_entries (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL,
  senior_name VARCHAR(255) NOT NULL,
  promoter_name VARCHAR(255) NOT NULL,
  promoter_phone VARCHAR(50) DEFAULT '',
  organization VARCHAR(255) DEFAULT '',
  time VARCHAR(20) DEFAULT '',
  comment TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_training_entries_date ON t_p24058207_website_creation_pro.training_entries(date);
