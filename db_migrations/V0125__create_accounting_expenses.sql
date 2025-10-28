-- Create accounting_expenses table for storing expenses and comments per shift
CREATE TABLE t_p24058207_website_creation_pro.accounting_expenses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    work_date DATE NOT NULL,
    organization_id INTEGER NOT NULL,
    expense_amount INTEGER DEFAULT 0,
    expense_comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES t_p24058207_website_creation_pro.users(id),
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES t_p24058207_website_creation_pro.organizations(id),
    CONSTRAINT unique_user_date_org UNIQUE (user_id, work_date, organization_id)
);

CREATE INDEX idx_accounting_expenses_user ON t_p24058207_website_creation_pro.accounting_expenses(user_id);
CREATE INDEX idx_accounting_expenses_date ON t_p24058207_website_creation_pro.accounting_expenses(work_date);

COMMENT ON TABLE t_p24058207_website_creation_pro.accounting_expenses IS 'Расходы и комментарии по сменам для бухучета';
COMMENT ON COLUMN t_p24058207_website_creation_pro.accounting_expenses.expense_amount IS 'Сумма расхода в рублях';
COMMENT ON COLUMN t_p24058207_website_creation_pro.accounting_expenses.expense_comment IS 'Комментарий к расходу';