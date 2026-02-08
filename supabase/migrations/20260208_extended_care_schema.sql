-- 1. Add Extended Care columns and Drop-off times to School Settings
ALTER TABLE public.school_settings
ADD COLUMN IF NOT EXISTS pickup_time_kg time DEFAULT '15:30',
ADD COLUMN IF NOT EXISTS pickup_time_elementary time DEFAULT '15:15',
ADD COLUMN IF NOT EXISTS dropoff_time_kg time DEFAULT '08:45',
ADD COLUMN IF NOT EXISTS dropoff_time_elementary time DEFAULT '08:15',
ADD COLUMN IF NOT EXISTS extended_care_rate_monthly decimal DEFAULT 80.00;

-- 2. Add Transport Mode to Enrollments
ALTER TABLE public.enrollments
ADD COLUMN IF NOT EXISTS transport_mode text CHECK (transport_mode IN ('PARENT', 'BUS', 'TAXI')) DEFAULT 'PARENT';

-- 3. Create Extended Care Enrollments Table
CREATE TABLE IF NOT EXISTS public.extended_care_enrollments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id uuid REFERENCES public.students(id) ON DELETE CASCADE NOT NULL,
  month date NOT NULL, -- Stored as first day of the month (e.g., '2026-02-01')
  drop_off_time time,
  pickup_time time,
  days_of_week jsonb, -- Array of strings e.g., ["Mon", "Tue"]
  manual_discount_amount decimal DEFAULT 0,
  manual_discount_reason text,
  final_fee decimal NOT NULL,
  audit_log jsonb, -- Stores calculation details
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Prevent duplicate enrollment for same student/month
  UNIQUE(student_id, month)
);

-- 4. RLS Policies
ALTER TABLE public.extended_care_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Read Extended Care" ON public.extended_care_enrollments
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Write Extended Care" ON public.extended_care_enrollments
    FOR ALL TO authenticated USING (true);
