-- Create staff_attendance table
CREATE TABLE IF NOT EXISTS public.staff_attendance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    status TEXT CHECK (status IN ('PRESENT', 'ABSENT', 'LATE', 'VACATION', 'HALF_DAY', 'SICK')) NOT NULL,
    check_in TIMESTAMPTZ,
    check_out TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(staff_id, date)
);

-- Enable RLS
ALTER TABLE public.staff_attendance ENABLE ROW LEVEL SECURITY;

-- Policies for staff_attendance
CREATE POLICY "Staff can view their own attendance" 
    ON public.staff_attendance FOR SELECT 
    USING (auth.uid() IN (SELECT id FROM public.profiles WHERE id = (SELECT id FROM public.staff WHERE id = staff_attendance.staff_id))); -- This might be complex depending on how staff links to auth. 
    -- Simplified: If staff.id matches auth.uid (if staff is same as profile) or linked via person.
    -- Assuming admin can view all.

CREATE POLICY "Admins can view all staff attendance"
    ON public.staff_attendance FOR SELECT
    USING (exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'));

CREATE POLICY "Admins can insert/update staff attendance"
    ON public.staff_attendance FOR ALL
    USING (exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'));

-- Add end_date to enrollments if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'enrollments' AND column_name = 'end_date') THEN
        ALTER TABLE public.enrollments ADD COLUMN end_date DATE;
    END IF;
END $$;
