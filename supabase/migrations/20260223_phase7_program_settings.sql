-- Phase 7: Program Settings — Finalize & Drop school_settings
--
-- 1. Add a UNIQUE constraint on (program_id, organization_id) so we can upsert
-- 2. Seed program_settings from school_settings — maps per-grade times to each program
-- 3. Enable RLS with correct policies (no profiles.role reference)
-- 4. DROP school_settings

-- ─── 1. Unique constraint (idempotent) ──────────────────────────────────────
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'program_settings_program_id_organization_id_key'
    ) THEN
        ALTER TABLE public.program_settings
            ADD CONSTRAINT program_settings_program_id_organization_id_key
            UNIQUE (program_id, organization_id);
    END IF;
END$$;

-- ─── 2. Seed from school_settings ────────────────────────────────────────────
-- Maps KG-named programs to KG-specific times, everything else to Elementary times.
INSERT INTO public.program_settings (
    program_id,
    organization_id,
    cutoff_time,
    dropoff_time,
    pickup_time,
    extended_care_rate_monthly,
    open_time,
    close_time,
    late_pickup_fee,
    late_fee_per_minute
)
SELECT
    p.id                                                 AS program_id,
    ss.organization_id,
    CASE
        WHEN p.name ILIKE '%KINDERGARTEN%' OR p.name ILIKE '%KG%'
        THEN COALESCE(ss.cutoff_time_kg,          ss.cutoff_time, '09:15:00')
        ELSE COALESCE(ss.cutoff_time_elementary,  ss.cutoff_time, '09:00:00')
    END                                                  AS cutoff_time,
    CASE
        WHEN p.name ILIKE '%KINDERGARTEN%' OR p.name ILIKE '%KG%'
        THEN COALESCE(ss.dropoff_time_kg,          '08:45:00')
        ELSE COALESCE(ss.dropoff_time_elementary,  '08:15:00')
    END                                                  AS dropoff_time,
    CASE
        WHEN p.name ILIKE '%KINDERGARTEN%' OR p.name ILIKE '%KG%'
        THEN COALESCE(ss.pickup_time_kg,           '15:30:00')
        ELSE COALESCE(ss.pickup_time_elementary,   '15:15:00')
    END                                                  AS pickup_time,
    COALESCE(ss.extended_care_rate_monthly, 80.00)       AS extended_care_rate_monthly,
    COALESCE(ss.open_time,  '07:30:00')                  AS open_time,
    COALESCE(ss.close_time, '18:00:00')                  AS close_time,
    COALESCE(ss.late_pickup_fee,     5.00)               AS late_pickup_fee,
    COALESCE(ss.late_fee_per_minute, 1.00)               AS late_fee_per_minute
FROM public.school_settings ss
JOIN public.programs p ON p.organization_id = ss.organization_id
WHERE NOT EXISTS (
    SELECT 1 FROM public.program_settings ps
    WHERE ps.program_id = p.id AND ps.organization_id = ss.organization_id
);

-- ─── 3. RLS ──────────────────────────────────────────────────────────────────
ALTER TABLE public.program_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow read for authenticated users"  ON public.program_settings;
DROP POLICY IF EXISTS "Allow write for authenticated users" ON public.program_settings;
DROP POLICY IF EXISTS "Allow write for admins"             ON public.program_settings;

CREATE POLICY "Allow read for authenticated users" ON public.program_settings
    FOR SELECT USING (auth.role() = 'authenticated');

-- NOTE: profiles.role no longer exists. Tighten this with user_roles after Phase 2.
CREATE POLICY "Allow write for authenticated users" ON public.program_settings
    FOR ALL WITH CHECK (auth.role() = 'authenticated');

-- ─── 4. Drop school_settings ─────────────────────────────────────────────────
DROP TABLE IF EXISTS public.school_settings;
