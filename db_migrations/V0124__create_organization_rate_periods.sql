-- Create organization_rate_periods table for storing rate periods
CREATE TABLE t_p24058207_website_creation_pro.organization_rate_periods (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    contact_rate INTEGER NOT NULL DEFAULT 0,
    payment_type VARCHAR(20) NOT NULL DEFAULT 'cash',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT valid_date_range CHECK (end_date IS NULL OR end_date >= start_date),
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES t_p24058207_website_creation_pro.organizations(id)
);

CREATE INDEX idx_org_rate_periods_org_id ON t_p24058207_website_creation_pro.organization_rate_periods(organization_id);
CREATE INDEX idx_org_rate_periods_dates ON t_p24058207_website_creation_pro.organization_rate_periods(start_date, end_date);

COMMENT ON TABLE t_p24058207_website_creation_pro.organization_rate_periods IS 'Тарифные периоды организаций с разными ставками';
COMMENT ON COLUMN t_p24058207_website_creation_pro.organization_rate_periods.start_date IS 'Дата начала действия ставки';
COMMENT ON COLUMN t_p24058207_website_creation_pro.organization_rate_periods.end_date IS 'Дата окончания (NULL = бессрочно)';
COMMENT ON COLUMN t_p24058207_website_creation_pro.organization_rate_periods.contact_rate IS 'Ставка за контакт в рублях';
COMMENT ON COLUMN t_p24058207_website_creation_pro.organization_rate_periods.payment_type IS 'Форма оплаты: cash или cashless';