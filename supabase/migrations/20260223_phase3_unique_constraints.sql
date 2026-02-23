-- Phase 3: Unique Constraints
-- Adds de-duplication constraints to enrollments and user_roles.
-- Runs de-dup cleanup first so the constraints don't fail on existing data.

-- 1. Remove duplicate enrollments before adding constraint
--    Keep the most recent enrollment per (student, classroom, academic_year)
DELETE FROM public.enrollments
WHERE id NOT IN (
    SELECT DISTINCT ON (student_id, classroom_id, academic_year_id) id
    FROM public.enrollments
    ORDER BY student_id, classroom_id, academic_year_id, created_at DESC
);

-- 2. Add unique constraint on enrollments
ALTER TABLE public.enrollments
    DROP CONSTRAINT IF EXISTS uq_enrollment_student_classroom_year;

ALTER TABLE public.enrollments
    ADD CONSTRAINT uq_enrollment_student_classroom_year
    UNIQUE (student_id, classroom_id, academic_year_id);

-- 3. Remove duplicate user_roles before adding constraint
DELETE FROM public.user_roles
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id, role, COALESCE(organization_id::text, ''), COALESCE(location_id::text, '')) id
    FROM public.user_roles
    ORDER BY user_id, role, COALESCE(organization_id::text, ''), COALESCE(location_id::text, ''), created_at DESC
);

-- 4. Add unique constraint on user_roles
ALTER TABLE public.user_roles
    DROP CONSTRAINT IF EXISTS uq_user_role_org_location;

ALTER TABLE public.user_roles
    ADD CONSTRAINT uq_user_role_org_location
    UNIQUE (user_id, role, organization_id, location_id);
