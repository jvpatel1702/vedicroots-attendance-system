-- Migration: Add Academic Years Table & Link to Settings
-- Required for seed data integrity

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

-- 3. Policies
-- Drop existing policies to avoid conflicts if re-running
DROP POLICY IF EXISTS "Enable read access for all users" ON public.academic_years;
DROP POLICY IF EXISTS "Enable write access for admins" ON public.academic_years;

CREATE POLICY "Enable read access for all users" ON public.academic_years
    FOR SELECT USING (true);

CREATE POLICY "Enable write access for admins" ON public.academic_years
    FOR ALL USING (auth.role() = 'service_role');

-- 4. Update School Settings to link to Academic Year (The Missing Piece!)
ALTER TABLE public.school_settings
ADD COLUMN IF NOT EXISTS current_academic_year_id UUID REFERENCES public.academic_years(id);
