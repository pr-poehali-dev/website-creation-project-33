-- Add missing work_shift record for Dolmatova on 2025-10-30
INSERT INTO t_p24058207_website_creation_pro.work_shifts 
(user_id, organization_id, shift_date, shift_start, shift_end, created_at, updated_at)
VALUES 
(7, 1, '2025-10-30', '2025-10-30 12:28:04.541373+00:00', '2025-10-30 16:07:42.655744+00:00', NOW(), NOW());