CREATE TABLE task_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO task_categories (name) VALUES ('Сайт'), ('Заказчики'), ('Другое');

CREATE TABLE tasks (
    id SERIAL PRIMARY KEY,
    text TEXT NOT NULL,
    responsible VARCHAR(100) NOT NULL,
    category_id INTEGER REFERENCES task_categories(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('done', 'in_progress', 'pending')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_responsible ON tasks(responsible);
CREATE INDEX idx_tasks_category ON tasks(category_id);
