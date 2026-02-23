-- Phase 5: Finance Additions
-- Adds scholarships and payments tables; extends invoices with org/enrollment links.

-- 1. Create scholarships table
CREATE TABLE IF NOT EXISTS public.scholarships (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    student_id      UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    discount_type   TEXT NOT NULL CHECK (discount_type IN ('PERCENT', 'FIXED')),
    discount_value  NUMERIC(10, 2) NOT NULL,
    start_date      DATE,
    end_date        DATE,
    notes           TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
    id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    invoice_id      UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
    student_id      UUID REFERENCES public.students(id) ON DELETE SET NULL,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    amount          NUMERIC(10, 2) NOT NULL,
    payment_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    method          TEXT CHECK (method IN ('CASH', 'CHECK', 'CARD', 'ACH', 'OTHER')),
    reference_number TEXT,
    notes           TEXT,
    recorded_by     UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Add organization_id and enrollment_id to invoices (if not already present)
ALTER TABLE public.invoices
    ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS enrollment_id   UUID REFERENCES public.enrollments(id) ON DELETE SET NULL;

-- 4. Enable RLS on new tables
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users" ON public.scholarships
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow write for authenticated users" ON public.scholarships
    FOR ALL WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow read for authenticated users" ON public.payments
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Allow write for authenticated users" ON public.payments
    FOR ALL WITH CHECK (auth.role() = 'authenticated');
