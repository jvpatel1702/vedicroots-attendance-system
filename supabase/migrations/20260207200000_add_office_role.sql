-- Add OFFICE role to the profiles table
-- This migration adds OFFICE as a valid role option

-- Update the role check constraint to include OFFICE
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('ADMIN', 'TEACHER', 'OFFICE'));

-- Note: Existing data is preserved. 
-- You can manually update existing STAFF users to OFFICE role if needed:
-- UPDATE public.profiles SET role = 'OFFICE' WHERE role = 'STAFF';
