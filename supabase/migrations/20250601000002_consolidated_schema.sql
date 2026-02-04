-- CONSOLIDATED MIGRATION: Fix all schema gaps for VedicRoots
-- Run this single file to ensure your database structure matches the app.

-- 1. Create Academic Years Table (if missing)
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Academic Years
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access" ON public.academic_years;
CREATE POLICY "Enable read access" ON public.academic_years FOR SELECT USING (true);
DROP POLICY IF EXISTS "Enable write access" ON public.academic_years;
CREATE POLICY "Enable write access" ON public.academic_years FOR ALL USING (auth.role() = 'service_role');


-- 2. Update School Settings Table (Add missing columns)
CREATE TABLE IF NOT EXISTS public.school_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name TEXT NOT NULL
);

ALTER TABLE public.school_settings 
    ADD COLUMN IF NOT EXISTS current_academic_year_id UUID REFERENCES public.academic_years(id),
    ADD COLUMN IF NOT EXISTS cutoff_time_kg TIME DEFAULT '09:15:00',
    ADD COLUMN IF NOT EXISTS cutoff_time_elementary TIME DEFAULT '09:00:00',
    ADD COLUMN IF NOT EXISTS late_fee_per_minute DECIMAL DEFAULT 1.00;

-- Remove old column if it exists and conflicts (optional, but good for cleanup)
ALTER TABLE public.school_settings DROP COLUMN IF EXISTS cutoff_time;


-- 3. Update Grades Table (Add 'type' for Kindergarten vs Elementary)
ALTER TABLE public.grades 
    ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('KINDERGARTEN', 'ELEMENTARY'));


-- 4. Create Student Vacations Table (if missing)
CREATE TABLE IF NOT EXISTS public.student_vacations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for Vacations
ALTER TABLE public.student_vacations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable read access vacations" ON public.student_vacations;
CREATE POLICY "Enable read access vacations" ON public.student_vacations FOR SELECT USING (auth.role() = 'authenticated');
DROP POLICY IF EXISTS "Enable write access vacations" ON public.student_vacations;
CREATE POLICY "Enable write access vacations" ON public.student_vacations FOR ALL USING (auth.role() = 'authenticated');


-- 5. Ensure Service Role has access to relevant tables
GRANT ALL ON public.academic_years TO service_role;
GRANT ALL ON public.school_settings TO service_role;
GRANT ALL ON public.student_vacations TO service_role;
