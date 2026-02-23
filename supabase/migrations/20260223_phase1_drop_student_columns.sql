-- Phase 1: Persons & Identity Consolidation
-- Drops duplicate name/contact columns from students and guardians now that
-- all queries have been updated to read from the persons table via person_id.
--
-- PREREQUISITE: Confirm no NULLs before running:
--   SELECT id FROM students WHERE person_id IS NULL;
--   SELECT id FROM guardians WHERE person_id IS NULL;

-- 1. Add gender to persons (moves from students.gender)
ALTER TABLE public.persons ADD COLUMN IF NOT EXISTS gender TEXT;

-- 2. Copy gender data from students to persons before dropping
UPDATE public.persons p
SET gender = s.gender
FROM public.students s
WHERE s.person_id = p.id AND s.gender IS NOT NULL;

-- 3. Drop duplicate columns from students
ALTER TABLE public.students
  DROP COLUMN IF EXISTS first_name,
  DROP COLUMN IF EXISTS last_name,
  DROP COLUMN IF EXISTS dob,
  DROP COLUMN IF EXISTS gender;

-- 4. Drop duplicate columns from guardians
ALTER TABLE public.guardians
  DROP COLUMN IF EXISTS first_name,
  DROP COLUMN IF EXISTS last_name,
  DROP COLUMN IF EXISTS email,
  DROP COLUMN IF EXISTS phone,
  DROP COLUMN IF EXISTS address;

-- 5. Add new columns to student_guardians for richer relationship data
ALTER TABLE public.student_guardians
  ADD COLUMN IF NOT EXISTS has_billing_responsibility BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS emergency_contact_priority INT DEFAULT 1,
  ADD COLUMN IF NOT EXISTS custody_notes TEXT;
