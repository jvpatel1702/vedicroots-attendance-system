-- Migration: People Management Refactor
-- Describes the shift to a unified `persons` table for Students, Guardians, and Staff.

-- 1. Create Persons Table
CREATE TABLE IF NOT EXISTS public.persons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    dob DATE,
    email TEXT,
    phone TEXT,
    photo_url TEXT,
    address TEXT,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Refactor Students Table
-- Add person_id FK
ALTER TABLE public.students ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE;

-- We will NOT drop the old columns yet to avoid data loss during development, 
-- but we will make them nullable or just ignore them in new queries.
-- Ideally in production we'd migrate data + drop columns. 
-- For this "clean slate" phase, we will just rely on seed data using the new structure.

-- 3. Refactor Guardians Table
ALTER TABLE public.guardians ADD COLUMN IF NOT EXISTS person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE;

-- 4. Enable RLS on new table
ALTER TABLE public.persons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.persons FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.persons FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.persons FOR UPDATE USING (true);
