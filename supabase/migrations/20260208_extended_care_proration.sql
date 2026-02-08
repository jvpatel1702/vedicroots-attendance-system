-- Add start_date to extended_care_enrollments for proration
ALTER TABLE public.extended_care_enrollments
ADD COLUMN IF NOT EXISTS start_date date DEFAULT CURRENT_DATE;

-- We also need to make sure we can handle multiple enrollments if they change mid-month? 
-- The user said "add another record". 
-- If we have a unique constraint on (student_id, month), we can't add another record for the same month.
-- We might need to drop that constraint or add 'start_date' to it.
-- Let's drop the constraint and add a new one including start_date, or just rely on ID.
-- But managing overlaps is hard. 
-- For now, let's assume one active enrollment per month, and if they change it, they update the EXISTING one with a new start date if it's a "new" start, OR we allow multiple.
-- "add another record with the change" suggests multiple.
-- Let's change the unique constraint to include start_date or just drop it. 
-- Safer to Drop it for flexibility, or make it (student_id, month, start_date).

ALTER TABLE public.extended_care_enrollments
DROP CONSTRAINT IF EXISTS extended_care_enrollments_student_id_month_key;

ALTER TABLE public.extended_care_enrollments
ADD CONSTRAINT extended_care_enrollments_student_id_month_start_date_key UNIQUE (student_id, month, start_date);
