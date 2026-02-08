-- Enable Write Access for Enrollments
-- Run this to ensuring you can Add/Edit enrollments

DROP POLICY IF EXISTS "Full Access" ON public.enrollments;
DROP POLICY IF EXISTS "Select Access" ON public.enrollments;
DROP POLICY IF EXISTS "Enable ALL for authenticated users" ON public.enrollments;

-- Create a single policy for ALL operations (Select, Insert, Update, Delete)
CREATE POLICY "Full Access" ON public.enrollments FOR ALL TO authenticated USING (true) WITH CHECK (true);
