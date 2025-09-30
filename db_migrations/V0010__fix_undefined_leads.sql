-- Update undefined leads to 'подход' + 'нейтральный'
UPDATE leads_analytics 
SET lead_type = 'подход', lead_result = 'нейтральный'
WHERE lead_type = 'неопределен' OR lead_result = 'неопределен';