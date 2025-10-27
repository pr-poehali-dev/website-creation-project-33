CREATE TABLE IF NOT EXISTS week_organization_filters (
    week_start DATE PRIMARY KEY,
    organizations TEXT NOT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_week_org_filters_week ON week_organization_filters(week_start);
