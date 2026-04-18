CREATE TABLE task_actions (
    id SERIAL PRIMARY KEY,
    task_id INTEGER NOT NULL REFERENCES tasks(id),
    comment TEXT NOT NULL,
    is_done BOOLEAN NOT NULL DEFAULT FALSE,
    done_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_task_actions_task_id ON task_actions(task_id);
