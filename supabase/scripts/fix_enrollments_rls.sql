
-- Enable SELECT for enrollments
DROP POLICY IF EXISTS "Select Access" ON public.enrollments;
CREATE POLICY "Select Access" ON public.enrollments FOR SELECT TO authenticated USING (true);

-- Also ensure SELECT for academic_years
DROP POLICY IF EXISTS "Select Access" ON public.academic_years;
CREATE POLICY "Select Access" ON public.academic_years FOR SELECT TO authenticated USING (true);

-- And ensure SELECT for students/persons if not already present
DROP POLICY IF EXISTS "Enable read access for all users" ON public.persons;
CREATE POLICY "Enable read access for all users" ON public.persons FOR SELECT USING (true);

DROP POLICY IF EXISTS "Select Access" ON public.students;
CREATE POLICY "Select Access" ON public.students FOR SELECT TO authenticated USING (true);
