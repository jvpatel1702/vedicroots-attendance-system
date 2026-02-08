-- Migration: Staff Management decoupling from Auth
-- Introduces 'staff' table linked to 'persons' to allow pre-creating teachers/admins without Auth accounts.

-- 1. Create Staff Table
CREATE TABLE IF NOT EXISTS public.staff (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    person_id UUID REFERENCES public.persons(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('ADMIN', 'TEACHER', 'STAFF')) DEFAULT 'TEACHER',
    email TEXT, -- Contact email, might differ from Person email or Auth email
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL -- Optional link to auth user once they sign up
);

-- 2. Migrate Teacher Classrooms
-- We need to drop the old table or alter it. Since we are in development, let's alter.
-- OLD: teacher_id references profiles(id)
-- NEW: staff_id references staff(id)

-- First, drop the old foreign key constraint
ALTER TABLE public.teacher_classrooms DROP CONSTRAINT IF EXISTS teacher_classrooms_teacher_id_fkey;

-- Add new column
ALTER TABLE public.teacher_classrooms ADD COLUMN IF NOT EXISTS staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE;

-- We can't easily migrate old data because profiles might not map 1:1 to new staff if they don't exist yet.
-- For this dev phase, we will truncate teacher_classrooms to start fresh.
TRUNCATE TABLE public.teacher_classrooms;

-- Remove old column and make new one primary part
ALTER TABLE public.teacher_classrooms DROP COLUMN teacher_id;
ALTER TABLE public.teacher_classrooms ALTER COLUMN staff_id SET NOT NULL;

-- Recreate Primary Key
ALTER TABLE public.teacher_classrooms ADD PRIMARY KEY (staff_id, classroom_id);


-- 3. Enable RLS
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read access for all users" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON public.staff FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON public.staff FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON public.staff FOR DELETE USING (true);

-- Update teacher_classrooms policies
DROP POLICY IF EXISTS "Read Access" ON public.teacher_classrooms;
CREATE POLICY "Read Access" ON public.teacher_classrooms FOR SELECT USING (true);
CREATE POLICY "Insert Access" ON public.teacher_classrooms FOR INSERT WITH CHECK (true);
CREATE POLICY "Update Access" ON public.teacher_classrooms FOR UPDATE USING (true);
CREATE POLICY "Delete Access" ON public.teacher_classrooms FOR DELETE USING (true);
