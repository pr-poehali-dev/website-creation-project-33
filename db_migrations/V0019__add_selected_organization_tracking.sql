-- Добавить поле для отслеживания когда пользователь выбрал организацию
ALTER TABLE t_p24058207_website_creation_pro.users 
ADD COLUMN selected_organization_id INTEGER REFERENCES t_p24058207_website_creation_pro.organizations(id),
ADD COLUMN selected_organization_date DATE;

CREATE INDEX idx_users_selected_org ON t_p24058207_website_creation_pro.users(selected_organization_id);
CREATE INDEX idx_users_selected_org_date ON t_p24058207_website_creation_pro.users(selected_organization_date);

COMMENT ON COLUMN t_p24058207_website_creation_pro.users.selected_organization_id IS 'Выбранная пользователем организация на сегодня';
COMMENT ON COLUMN t_p24058207_website_creation_pro.users.selected_organization_date IS 'Дата когда была выбрана организация (для ежедневного сброса)';