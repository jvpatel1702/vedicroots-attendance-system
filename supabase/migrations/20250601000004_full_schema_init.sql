-- MASTER MIGRATION: Full Database Initialization for VedicRoots
-- Run this to ensure ALL tables and relationships are correctly set up.
-- Based on database_design.md and code requirements.

-- 1. Profiles (Admins & Teachers)
-- Note: 'auth.users' is managed by Supabase Auth.
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('ADMIN', 'TEACHER', 'PARENT')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- Profiles are viewable by authenticated users (for admin lists)
CREATE POLICY "View profiles" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
-- Users can update their own profile
CREATE POLICY "Update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
-- Admins/Service Role can manage all
CREATE POLICY "Manage profiles" ON public.profiles FOR ALL USING (auth.role() = 'service_role');


-- 2. Academic Years
CREATE TABLE IF NOT EXISTS public.academic_years (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    active BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.academic_years ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read academic years" ON public.academic_years FOR SELECT USING (true);
CREATE POLICY "Manage academic years" ON public.academic_years FOR ALL USING (auth.role() = 'authenticated');


-- 3. Grades
CREATE TABLE IF NOT EXISTS public.grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    type TEXT CHECK (type IN ('KINDERGARTEN', 'ELEMENTARY')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read grades" ON public.grades FOR SELECT USING (true);
CREATE POLICY "Manage grades" ON public.grades FOR ALL USING (auth.role() = 'authenticated');


-- 4. School Settings
CREATE TABLE IF NOT EXISTS public.school_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    school_name TEXT NOT NULL DEFAULT 'VedicRoots',
    current_academic_year_id UUID REFERENCES public.academic_years(id),
    cutoff_time_kg TIME DEFAULT '09:15:00',
    cutoff_time_elementary TIME DEFAULT '09:00:00',
    late_fee_per_minute DECIMAL DEFAULT 1.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.school_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read settings" ON public.school_settings FOR SELECT USING (true);
CREATE POLICY "Manage settings" ON public.school_settings FOR ALL USING (auth.role() = 'authenticated');


-- 5. Classrooms
CREATE TABLE IF NOT EXISTS public.classrooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    capacity INTEGER DEFAULT 20,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.classrooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read classrooms" ON public.classrooms FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Manage classrooms" ON public.classrooms FOR ALL USING (auth.role() = 'authenticated');


-- 6. Classroom Grades (Mapping)
CREATE TABLE IF NOT EXISTS public.classroom_grades (
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
    grade_id UUID REFERENCES public.grades(id) ON DELETE CASCADE,
    PRIMARY KEY (classroom_id, grade_id)
);
ALTER TABLE public.classroom_grades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read classroom grades" ON public.classroom_grades FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Manage classroom grades" ON public.classroom_grades FOR ALL USING (auth.role() = 'authenticated');


-- 7. Students
CREATE TABLE IF NOT EXISTS public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    profile_picture TEXT,
    classroom_id UUID REFERENCES public.classrooms(id),
    grade_id UUID REFERENCES public.grades(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read students" ON public.students FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Manage students" ON public.students FOR ALL USING (auth.role() = 'authenticated');


-- 8. Student Vacations
CREATE TABLE IF NOT EXISTS public.student_vacations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.student_vacations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read vacations" ON public.student_vacations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Manage vacations" ON public.student_vacations FOR ALL USING (auth.role() = 'authenticated');


-- 9. Teacher Classrooms (Assignments)
CREATE TABLE IF NOT EXISTS public.teacher_classrooms (
    teacher_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    classroom_id UUID REFERENCES public.classrooms(id) ON DELETE CASCADE,
    academic_year_id UUID REFERENCES public.academic_years(id), -- Optional
    PRIMARY KEY (teacher_id, classroom_id)
);
ALTER TABLE public.teacher_classrooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read teacher assignments" ON public.teacher_classrooms FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Manage teacher assignments" ON public.teacher_classrooms FOR ALL USING (auth.role() = 'authenticated');


-- 10. Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES public.students(id),
    date DATE NOT NULL,
    status TEXT CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'UNMARKED')),
    marked_by UUID REFERENCES public.profiles(id),
    arrival_time TIME,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, date)
);
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Read attendance" ON public.attendance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Manage attendance" ON public.attendance FOR ALL USING (auth.role() = 'authenticated');

-- Grant permissions to authenticated role (essential for API)
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO authenticated;
