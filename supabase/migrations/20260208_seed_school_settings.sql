-- Migration: Seed Missing School Settings
-- Iterates through all organizations and creates a default school_settings record if one doesn't exist.

DO $$
DECLARE
    org_rec RECORD;
BEGIN
    FOR org_rec IN SELECT id FROM public.organizations LOOP
        
        -- Insert default settings if not exists
        INSERT INTO public.school_settings (organization_id, cutoff_time, late_fee_per_minute, extended_care_rate_monthly)
        VALUES (org_rec.id, '09:30:00', 1.00, 80.00)
        ON CONFLICT DO NOTHING; -- Assuming there might be a constraint, though schema doesn't show explicit unique constraint on org_id. 
        -- If no unique constraint, we should check first.
        
        IF NOT EXISTS (SELECT 1 FROM public.school_settings WHERE organization_id = org_rec.id) THEN
             INSERT INTO public.school_settings (organization_id, cutoff_time, late_fee_per_minute, extended_care_rate_monthly)
             VALUES (org_rec.id, '09:30:00', 1.00, 80.00);
        END IF;

    END LOOP;
END $$;
