-- Migration: Align with System Documentation

-- 1. Update Grades Table
ALTER TABLE public.grades 
ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('KINDERGARTEN', 'ELEMENTARY'));

-- 2. Create Student Vacations Table
CREATE TABLE IF NOT EXISTS public.student_vacations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for student_vacations
ALTER TABLE public.student_vacations ENABLE ROW LEVEL SECURITY;

-- Policy: View access
CREATE POLICY "Enable read access for authenticated users" ON public.student_vacations
    FOR SELECT USING (auth.role() = 'authenticated');

-- 3. Update School Settings
ALTER TABLE public.school_settings 
DROP COLUMN IF EXISTS cutoff_time,
ADD COLUMN IF NOT EXISTS cutoff_time_kg TIME DEFAULT '09:15:00',
ADD COLUMN IF NOT EXISTS cutoff_time_elementary TIME DEFAULT '09:00:00',
ADD COLUMN IF NOT EXISTS late_fee_per_minute DECIMAL DEFAULT 1.00;
