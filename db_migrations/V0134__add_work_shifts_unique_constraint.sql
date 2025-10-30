-- Add unique constraint to prevent duplicate shifts for same user/org/date
ALTER TABLE t_p24058207_website_creation_pro.work_shifts 
ADD CONSTRAINT work_shifts_user_org_date_unique 
UNIQUE (user_id, organization_id, shift_date);