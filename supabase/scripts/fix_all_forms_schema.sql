-- MASTER FIX SCRIPT (Idempotent Version)
-- Run this entire script in Supabase SQL Editor. It will safely drop and recreate policies.

-- 1. Fix Enrollments Permission
DROP POLICY IF EXISTS "Select Access" ON public.enrollments;
CREATE POLICY "Select Access" ON public.enrollments FOR SELECT TO authenticated USING (true);

-- 2. Fix Student Medical Permissions
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.student_medical;
CREATE POLICY "Enable insert for authenticated users" ON public.student_medical FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.student_medical;
CREATE POLICY "Enable update for authenticated users" ON public.student_medical FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.student_medical;
CREATE POLICY "Enable delete for authenticated users" ON public.student_medical FOR DELETE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.student_medical;
CREATE POLICY "Enable read access for authenticated users" ON public.student_medical FOR SELECT TO authenticated USING (true);

-- 3. Restore Missing Vacations Table & Permissions
CREATE TABLE IF NOT EXISTS public.student_vacations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.student_vacations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read Access" ON public.student_vacations;
CREATE POLICY "Read Access" ON public.student_vacations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Insert Access" ON public.student_vacations;
CREATE POLICY "Insert Access" ON public.student_vacations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Delete Access" ON public.student_vacations;
CREATE POLICY "Delete Access" ON public.student_vacations FOR DELETE TO authenticated USING (true);

-- 4. Ensure related tables are readable
DROP POLICY IF EXISTS "Select Access" ON public.academic_years;
CREATE POLICY "Select Access" ON public.academic_years FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Select Access" ON public.students;
CREATE POLICY "Select Access" ON public.students FOR SELECT TO authenticated USING (true);
