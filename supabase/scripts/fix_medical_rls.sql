-- Allow authenticated users to Insert/Update/Delete student medical records
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.student_medical;
CREATE POLICY "Enable insert for authenticated users" ON public.student_medical FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON public.student_medical;
CREATE POLICY "Enable update for authenticated users" ON public.student_medical FOR UPDATE TO authenticated USING (true);

DROP POLICY IF EXISTS "Enable delete for authenticated users" ON public.student_medical;
CREATE POLICY "Enable delete for authenticated users" ON public.student_medical FOR DELETE TO authenticated USING (true);

-- Ensure Read Access (if not already present)
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON public.student_medical;
CREATE POLICY "Enable read access for authenticated users" ON public.student_medical FOR SELECT TO authenticated USING (true);
