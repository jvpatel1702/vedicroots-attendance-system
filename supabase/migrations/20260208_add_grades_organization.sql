-- Add organization_id to grades table for organization-specific grades
-- Daycare can have "Toddler", "Infant" while School has "JK", "SK"

DO $$
BEGIN
    -- Add organization_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema='public' 
        AND table_name='grades' 
        AND column_name='organization_id'
    ) THEN
        ALTER TABLE public.grades ADD COLUMN organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE;
        RAISE NOTICE '✅ Added organization_id column to grades';
    END IF;
END $$;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_grades_organization_id ON public.grades(organization_id);
