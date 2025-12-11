-- Добавление структурированных полей для места работы
ALTER TABLE t_p24058207_website_creation_pro.work_location_comments 
ADD COLUMN organization VARCHAR(255),
ADD COLUMN location_type VARCHAR(50),
ADD COLUMN location_details TEXT;

-- Добавление комментариев для документации
COMMENT ON COLUMN t_p24058207_website_creation_pro.work_location_comments.organization IS 'Название организации из справочника';
COMMENT ON COLUMN t_p24058207_website_creation_pro.work_location_comments.location_type IS 'Тип места: ТЦ, Школа, Садик, Улица';
COMMENT ON COLUMN t_p24058207_website_creation_pro.work_location_comments.location_details IS 'Свободное описание адреса/деталей места';