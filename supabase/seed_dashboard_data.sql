
-- Seed Staff Attendance (Present Today)
INSERT INTO public.staff_attendance (staff_id, date, status, check_in)
SELECT id, CURRENT_DATE, 'PRESENT', NOW() - INTERVAL '4 hours'
FROM public.staff
WHERE role = 'TEACHER'
LIMIT 2
ON CONFLICT (staff_id, date) DO NOTHING;

-- Seed Absent Students (Today)
-- We need to insert into attendance table. 
-- First get some student IDs.
DO $$
DECLARE
    s_id uuid;
BEGIN
    FOR s_id IN SELECT id FROM public.students LIMIT 2 LOOP
        INSERT INTO public.attendance (student_id, date, status, marked_by)
        VALUES (s_id, CURRENT_DATE, 'ABSENT', NULL)
        ON CONFLICT (student_id, date) DO UPDATE SET status = 'ABSENT';
    END LOOP;
END $$;

-- Seed Enrollments (Joining This Month)
-- Update existing or insert new. Let's update a few existing to be joining this month.
UPDATE public.enrollments
SET enrollment_date = CURRENT_DATE
WHERE id IN (SELECT id FROM public.enrollments LIMIT 1);

-- Seed Enrollments (Upcoming Next Month)
-- Update one to be next month
UPDATE public.enrollments
SET enrollment_date = (CURRENT_DATE + INTERVAL '1 month')
WHERE id IN (SELECT id FROM public.enrollments OFFSET 1 LIMIT 1);

-- Seed Enrollments (Finishing This Month)
-- Update one to finish end of this month
UPDATE public.enrollments
SET end_date = (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date
WHERE id IN (SELECT id FROM public.enrollments OFFSET 2 LIMIT 1);
