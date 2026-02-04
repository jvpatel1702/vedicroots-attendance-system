-- Migration: Add Academic Years Table
-- Required for seed data integrity

CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Enable read access for all users" ON public.academic_years
    FOR SELECT USING (true);

CREATE POLICY "Enable write access for admins" ON public.academic_years
    FOR ALL USING (auth.role() = 'service_role'); -- Simplified for now, or check admin role
