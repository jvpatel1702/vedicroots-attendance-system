-- Migration: Staff Attendance System Enhancements
-- Created: 2026-02-11

-- 1. Create Pay Periods Table
CREATE TABLE IF NOT EXISTS public.pay_periods (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL references public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL, -- e.g. "Feb 1 - Feb 15, 2026"
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status TEXT CHECK (status IN ('OPEN', 'CLOSED', 'PROCESSING')) DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure no overlapping periods for same org (optional, but good practice. simplified for now)
    UNIQUE(organization_id, start_date, end_date) 
);

-- Enable RLS for pay_periods
ALTER TABLE public.pay_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pay periods"
    ON public.pay_periods FOR ALL
    USING (exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'));

CREATE POLICY "Staff can view pay periods"
    ON public.pay_periods FOR SELECT
    USING (auth.uid() IN (
        SELECT user_id FROM public.staff 
        WHERE organization_id = pay_periods.organization_id
    ) OR exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'));


-- 2. Create School QR Config Table
CREATE TABLE IF NOT EXISTS public.school_qr_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL references public.organizations(id) ON DELETE CASCADE,
    code_value TEXT NOT NULL, -- The secret value encoded in the QR
    active BOOLEAN DEFAULT true,
    reset_at TIMESTAMPTZ, -- If we want to rotate codes
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id)
);

-- Enable RLS for school_qr_config
ALTER TABLE public.school_qr_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage qr config"
    ON public.school_qr_config FOR ALL
    USING (exists (select 1 from public.profiles where id = auth.uid() and role = 'ADMIN'));

CREATE POLICY "Staff can read qr config (to verify)" 
    ON public.school_qr_config FOR SELECT
    USING (true); -- Needed for the verify endpoint or just public? Let's restrict to auth users.
    
-- Update Policy to be safer
DROP POLICY IF EXISTS "Staff can read qr config (to verify)" ON public.school_qr_config;
CREATE POLICY "Authenticated users can read qr config"
    ON public.school_qr_config FOR SELECT
    USING (auth.role() = 'authenticated');


-- 3. Update Staff Attendance Table
-- We are altering the existing table from 20260207_add_staff_attendance.sql

-- Add columns if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_attendance' AND column_name = 'pay_period_id') THEN
        ALTER TABLE public.staff_attendance ADD COLUMN pay_period_id UUID REFERENCES public.pay_periods(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_attendance' AND column_name = 'location_verified') THEN
        ALTER TABLE public.staff_attendance ADD COLUMN location_verified BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_attendance' AND column_name = 'location_lat') THEN
        ALTER TABLE public.staff_attendance ADD COLUMN location_lat FLOAT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_attendance' AND column_name = 'location_lng') THEN
        ALTER TABLE public.staff_attendance ADD COLUMN location_lng FLOAT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_attendance' AND column_name = 'break_minutes') THEN
        ALTER TABLE public.staff_attendance ADD COLUMN break_minutes INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_attendance' AND column_name = 'break_deducted') THEN
        ALTER TABLE public.staff_attendance ADD COLUMN break_deducted BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_attendance' AND column_name = 'work_minutes') THEN
        ALTER TABLE public.staff_attendance ADD COLUMN work_minutes INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff_attendance' AND column_name = 'notes') THEN
        ALTER TABLE public.staff_attendance ADD COLUMN notes TEXT;
    END IF;
END $$;
