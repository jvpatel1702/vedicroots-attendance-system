-- Seed Organization and Location if missing

DO $$
DECLARE
    org_id UUID;
BEGIN
    -- 1. Ensure Organization exists
    INSERT INTO public.organizations (name, type)
    VALUES ('Vedic Roots', 'SCHOOL')
    ON CONFLICT DO NOTHING;

    SELECT id INTO org_id FROM public.organizations WHERE name = 'Vedic Roots' LIMIT 1;

    -- 2. Ensure Location exists
    INSERT INTO public.locations (organization_id, name, address, capacity)
    VALUES (org_id, 'Main Campus', '123 Vedic Way', 500)
    ON CONFLICT DO NOTHING;
    
END $$;
