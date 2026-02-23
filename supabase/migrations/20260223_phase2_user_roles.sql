-- Phase 2: User Roles Restructure
-- Creates a user_roles junction table for proper multi-role support.
-- The old profiles.role and profiles.roles columns are NOT dropped here —
-- they are kept as a fallback until a full RLS audit is complete.

-- 1. Create user_roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role        TEXT NOT NULL CHECK (role IN ('SUPER_ADMIN', 'ADMIN', 'ORG_ADMIN', 'OFFICE', 'TEACHER', 'ELECTIVE_TEACHER', 'PARENT')),
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    location_id     UUID REFERENCES public.locations(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 2. NOTE: Skipping role migration from profiles — profiles.role column no longer exists.
--    All role data should be entered directly into user_roles.

-- 3. Indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_org_role ON public.user_roles(organization_id, role);

-- 4. Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies first so this migration is idempotent
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Authenticated users can manage roles" ON public.user_roles;

-- Users can read their own roles
CREATE POLICY "Users can read own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

-- Any authenticated user can manage roles (tighten later after full RLS audit)
-- NOTE: profiles.role no longer exists, so we use auth.role() instead
CREATE POLICY "Authenticated users can manage roles" ON public.user_roles
    FOR ALL WITH CHECK (auth.role() = 'authenticated');
