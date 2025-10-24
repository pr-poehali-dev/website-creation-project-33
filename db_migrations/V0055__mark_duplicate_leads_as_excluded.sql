-- Отмечаем дубликаты как исключённые (is_excluded = TRUE)
-- Оставляем активными только записи с минимальным id для каждой уникальной комбинации
UPDATE t_p24058207_website_creation_pro.archive_leads_analytics
SET is_excluded = TRUE
WHERE id IN (
    SELECT id 
    FROM (
        SELECT 
            id,
            ROW_NUMBER() OVER (
                PARTITION BY 
                    COALESCE(promoter_name, 'Unknown'),
                    DATE(created_at + interval '3 hours'),
                    lead_type
                ORDER BY created_at ASC, id ASC
            ) as row_num
        FROM t_p24058207_website_creation_pro.archive_leads_analytics
        WHERE is_excluded IS NULL OR is_excluded = FALSE
    ) as ranked
    WHERE row_num > 1
);