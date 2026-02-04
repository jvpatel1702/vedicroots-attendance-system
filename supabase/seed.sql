-- Seed data for VedicRoots Attendance System (System Documentation 2025-2026)
-- Updated: Fixed 's' UUID error (replaced with 'd' for valid hex)

-- 1. Academic Year
INSERT INTO public.academic_years (id, name, start_date, end_date, active)
VALUES ('a2025000-0000-0000-0000-000000000001', '2025-2026', '2025-09-01', '2026-06-26', true)
ON CONFLICT (id) DO NOTHING;

-- 2. School Settings
-- Fixed: Used 'd' instead of 's' (s is not valid hex)
INSERT INTO public.school_settings (id, school_name, current_academic_year_id, cutoff_time_kg, cutoff_time_elementary, late_fee_per_minute)
VALUES ('d0000000-0000-0000-0000-000000000001', 'VedicRoots', 'a2025000-0000-0000-0000-000000000001', '09:15:00', '09:00:00', 1.00)
ON CONFLICT (id) DO NOTHING;

-- 3. Grades
INSERT INTO public.grades (id, name, "order", type) VALUES
('b0000000-0000-0000-0000-000000000001', 'JK', 1, 'KINDERGARTEN'),
('b0000000-0000-0000-0000-000000000002', 'SK', 2, 'KINDERGARTEN'),
('b0000000-0000-0000-0000-000000000003', 'Grade 1', 3, 'ELEMENTARY'),
('b0000000-0000-0000-0000-000000000004', 'Grade 2', 4, 'ELEMENTARY'),
('b0000000-0000-0000-0000-000000000005', 'Grade 3', 5, 'ELEMENTARY'),
('b0000000-0000-0000-0000-000000000006', 'Grade 4', 6, 'ELEMENTARY'),
('b0000000-0000-0000-0000-000000000007', 'Grade 5', 7, 'ELEMENTARY'),
('b0000000-0000-0000-0000-000000000008', 'Grade 6', 8, 'ELEMENTARY'),
('b0000000-0000-0000-0000-000000000009', 'Grade 7', 9, 'ELEMENTARY')
ON CONFLICT (id) DO NOTHING;

-- 4. Classrooms
INSERT INTO public.classrooms (id, name, capacity) VALUES
('c1000000-0000-0000-0000-000000000001', 'KG 1', 20),
('c2000000-0000-0000-0000-000000000002', 'KG 2', 20),
('c3000000-0000-0000-0000-000000000003', 'Lower Elementary', 30),
('c4000000-0000-0000-0000-000000000004', 'Upper Elementary', 30)
ON CONFLICT (id) DO NOTHING;

-- 5. Classroom Grades Mapping
INSERT INTO public.classroom_grades (classroom_id, grade_id) VALUES
('c1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001'), -- KG 1 -> JK
('c1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002'), -- KG 1 -> SK
('c2000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001'), -- KG 2 -> JK
('c2000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000002'), -- KG 2 -> SK
('c3000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003'), -- Gr 1
('c3000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000004'), -- Gr 2
('c3000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005'), -- Gr 3
('c4000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000006'), -- Gr 4
('c4000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000007'), -- Gr 5
('c4000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000008'), -- Gr 6
('c4000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000009')  -- Gr 7
ON CONFLICT (classroom_id, grade_id) DO NOTHING;

-- 6. Students
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.students WHERE first_name = 'Aarav' AND last_name = 'Sharma') THEN
        INSERT INTO public.students (first_name, last_name, classroom_id, grade_id) VALUES
        ('Aarav', 'Sharma', 'c1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.students WHERE first_name = 'Ishani' AND last_name = 'Verma') THEN
        INSERT INTO public.students (first_name, last_name, classroom_id, grade_id) VALUES
        ('Ishani', 'Verma', 'c1000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000002');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.students WHERE first_name = 'Vihaan' AND last_name = 'Gupta') THEN
        INSERT INTO public.students (first_name, last_name, classroom_id, grade_id) VALUES
        ('Vihaan', 'Gupta', 'c2000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.students WHERE first_name = 'Ananya' AND last_name = 'Iyer') THEN
        INSERT INTO public.students (first_name, last_name, classroom_id, grade_id) VALUES
        ('Ananya', 'Iyer', 'c3000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000003');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.students WHERE first_name = 'Reyansh' AND last_name = 'Malhotra') THEN
        INSERT INTO public.students (first_name, last_name, classroom_id, grade_id) VALUES
        ('Reyansh', 'Malhotra', 'c3000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000005');
    END IF;

    IF NOT EXISTS (SELECT 1 FROM public.students WHERE first_name = 'Myra' AND last_name = 'Singh') THEN
        INSERT INTO public.students (first_name, last_name, classroom_id, grade_id) VALUES
        ('Myra', 'Singh', 'c4000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000008');
    END IF;
END $$;
