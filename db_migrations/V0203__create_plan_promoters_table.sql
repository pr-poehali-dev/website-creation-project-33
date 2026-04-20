CREATE TABLE t_p24058207_website_creation_pro.plan_promoters (
    id SERIAL PRIMARY KEY,
    plan_id INTEGER NOT NULL,
    promoter_id INTEGER NOT NULL REFERENCES t_p24058207_website_creation_pro.users(id),
    org_name TEXT NULL,
    place_type VARCHAR(50) NULL,
    address TEXT NULL,
    leaflets TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_plan_promoters_plan_id ON t_p24058207_website_creation_pro.plan_promoters(plan_id);

INSERT INTO t_p24058207_website_creation_pro.plan_promoters (plan_id, promoter_id, org_name, place_type, address, leaflets)
SELECT id, promoter_id, promoter_org_name, promoter_place_type, promoter_address, promoter_leaflets
FROM t_p24058207_website_creation_pro.planned_organizations
WHERE promoter_id IS NOT NULL;
