-- Add multi-role support to profiles table
-- This allows users to have multiple roles (e.g., TEACHER + PARENT)

-- Add roles array column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT ARRAY['TEACHER']::TEXT[];

-- Migrate existing role to roles array
UPDATE public.profiles 
SET roles = ARRAY[role]::TEXT[] 
WHERE roles IS NULL OR roles = '{}';

-- Update the role check constraint to include PARENT
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('ADMIN', 'TEACHER', 'OFFICE', 'PARENT'));

-- Add comment explaining the roles system
COMMENT ON COLUMN public.profiles.roles IS 'Array of roles for multi-role support. Valid values: ADMIN, TEACHER, OFFICE, PARENT';
COMMENT ON COLUMN public.profiles.role IS 'Primary role (legacy). Use roles array for multi-role checks.';
