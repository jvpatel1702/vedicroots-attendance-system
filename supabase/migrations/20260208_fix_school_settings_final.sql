-- Diagnostic & Fix Script for Missing School Settings

DO $$
DECLARE
    org_rec RECORD;
    settings_count INTEGER;
BEGIN
    -- 1. Log Organizations Found
    RAISE NOTICE 'Starting School Settings Diagnostic...';
    
    FOR org_rec IN SELECT id, name FROM public.organizations LOOP
        
        -- Check if settings exist for this org
        SELECT COUNT(*) INTO settings_count 
        FROM public.school_settings 
        WHERE organization_id = org_rec.id;
        
        IF settings_count > 0 THEN
            RAISE NOTICE '✅ Organization "%" (ID: %) has settings.', org_rec.name, org_rec.id;
        ELSE
            RAISE NOTICE '❌ Organization "%" (ID: %) MISSING settings. Creating now...', org_rec.name, org_rec.id;
            
            -- Insert DEFAULT settings
            INSERT INTO public.school_settings (
                organization_id, 
                cutoff_time, 
                late_fee_per_minute, 
                extended_care_rate_monthly, -- New Column
                dropoff_time_kg,            -- New Column
                dropoff_time_elementary,    -- New Column
                pickup_time_kg,             -- New Column
                pickup_time_elementary      -- New Column
            )
            VALUES (
                org_rec.id, 
                '09:30:00', 
                1.00, 
                80.00,
                '08:45',
                '08:15',
                '15:30',
                '15:15'
            );
            
            RAISE NOTICE '   -> Created default settings for %. Please verify.', org_rec.name;
        END IF;

    END LOOP;
    
    -- 2. Add Unique Constraint to Prevent Duplicates going forward
    -- First, remove duplicates if any exist (keeping the latest one)
    DELETE FROM public.school_settings a USING public.school_settings b
    WHERE a.id < b.id AND a.organization_id = b.organization_id;
    
    -- Add the constraint if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'school_settings_organization_id_key'
    ) THEN
        ALTER TABLE public.school_settings ADD CONSTRAINT school_settings_organization_id_key UNIQUE (organization_id);
        RAISE NOTICE '✅ Added UNIQUE constraint on organization_id.';
    END IF;

    RAISE NOTICE 'Diagnostic Complete.';
END $$;
