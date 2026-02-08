-- Re-create student_vacations table (was dropped in overhaul)
CREATE TABLE IF NOT EXISTS public.student_vacations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id UUID REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.student_vacations ENABLE ROW LEVEL SECURITY;

-- Add Policies
DROP POLICY IF EXISTS "Read Access" ON public.student_vacations;
CREATE POLICY "Read Access" ON public.student_vacations FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Insert Access" ON public.student_vacations;
CREATE POLICY "Insert Access" ON public.student_vacations FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Delete Access" ON public.student_vacations;
CREATE POLICY "Delete Access" ON public.student_vacations FOR DELETE TO authenticated USING (true);
