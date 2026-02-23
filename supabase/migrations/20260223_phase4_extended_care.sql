-- Phase 4: Extended Care Linking
-- Creates checkin/adjustment tables for richer extended care tracking.

-- 1. Add subscription_id FK to extended_care_enrollments (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'extended_care_enrollments') THEN
        ALTER TABLE public.extended_care_enrollments
            ADD COLUMN IF NOT EXISTS subscription_id UUID REFERENCES public.extended_care_subscriptions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. Create extended_care_checkins table
CREATE TABLE IF NOT EXISTS public.extended_care_checkins (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id          UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subscription_id     UUID REFERENCES public.extended_care_subscriptions(id) ON DELETE SET NULL,
    date                DATE NOT NULL,
    actual_dropoff_time TIME,
    actual_pickup_time  TIME,
    late_pickup_fee     NUMERIC(10, 2) DEFAULT 0,
    notes               TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (student_id, date)
);

-- 3. Create extended_care_adjustments table
CREATE TABLE IF NOT EXISTS public.extended_care_adjustments (
    id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id          UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    subscription_id     UUID REFERENCES public.extended_care_subscriptions(id) ON DELETE SET NULL,
    adjustment_date     DATE NOT NULL,
    adjustment_type     TEXT NOT NULL CHECK (adjustment_type IN ('ABSENCE_DEDUCTION', 'HOLIDAY_DEDUCTION', 'LATE_FEE', 'CREDIT', 'OTHER')),
    deduction_minutes   INT DEFAULT 0,
    deduction_amount    NUMERIC(10, 2) DEFAULT 0,
    note                TEXT,
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS on both new tables
ALTER TABLE public.extended_care_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extended_care_adjustments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.extended_care_checkins
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON public.extended_care_checkins
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated users" ON public.extended_care_adjustments
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert for authenticated users" ON public.extended_care_adjustments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
