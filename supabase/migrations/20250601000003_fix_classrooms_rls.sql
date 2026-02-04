-- Migration: Fix Row Level Security (RLS) for Admin Tables
-- Enables CRUD operations for authenticated users (Admins)

-- 1. Classrooms
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all modify access for authenticated users" ON public.classrooms;
CREATE POLICY "Enable modify access for authenticated users" ON public.classrooms
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- 2. Students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable modify access for authenticated users" ON public.students;
CREATE POLICY "Enable modify access for authenticated users" ON public.students
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- 3. Teachers & Teacher Classrooms
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teacher_classrooms ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable teacher modify" ON public.teachers;
CREATE POLICY "Enable teacher modify" ON public.teachers
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable teacher_classroom modify" ON public.teacher_classrooms;
CREATE POLICY "Enable teacher_classroom modify" ON public.teacher_classrooms
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- 4. Grades & Classroom Grades (Mapping)
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classroom_grades ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for all" ON public.grades FOR SELECT USING (true);
-- Grades are usually static, but allowing write for authenticated just in case
CREATE POLICY "Enable grades modify" ON public.grades FOR ALL USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Enable classroom_grades modify" ON public.classroom_grades;
CREATE POLICY "Enable classroom_grades modify" ON public.classroom_grades
    FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');

