-- Add daycare-specific settings columns to school_settings table
-- These new columns support daycare organizations which have different operational needs

DO $$
BEGIN
    -- Add open_time column for daycare open time
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='school_settings' 
        AND column_name='open_time'
    ) THEN
        ALTER TABLE public.school_settings ADD COLUMN open_time time DEFAULT '07:30:00';
        RAISE NOTICE '✅ Added open_time column to school_settings';
    END IF;

    -- Add close_time column for daycare close time
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='school_settings' 
        AND column_name='close_time'
    ) THEN
        ALTER TABLE public.school_settings ADD COLUMN close_time time DEFAULT '18:00:00';
        RAISE NOTICE '✅ Added close_time column to school_settings';
    END IF;

    -- Add late_pickup_fee column for daycare late pickup fee per minute
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='school_settings' 
        AND column_name='late_pickup_fee'
    ) THEN
        ALTER TABLE public.school_settings ADD COLUMN late_pickup_fee numeric(10,2) DEFAULT 5.00;
        RAISE NOTICE '✅ Added late_pickup_fee column to school_settings';
    END IF;
END $$;
