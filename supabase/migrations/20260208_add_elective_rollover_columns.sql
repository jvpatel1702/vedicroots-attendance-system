-- Add rollover support to elective attendance
ALTER TABLE public.elective_attendance 
ADD COLUMN IF NOT EXISTS is_rollover BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS rollover_note TEXT;
