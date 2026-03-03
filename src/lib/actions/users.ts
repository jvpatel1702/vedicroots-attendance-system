'use server';

import { createAdminClient } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Helper to ensure current user is an Admin.
 * Queries the `user_roles` table (source of truth for roles since Phase 2).
 * `profiles.role` / `profiles.roles` no longer exist.
 */
async function ensureAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    // Check `user_roles` table — the canonical source of role data
    const { data: roleRow, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .in('role', ['ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN'])
        .limit(1)
        .maybeSingle();

    if (error) throw new Error('Failed to verify role: ' + error.message);
    if (!roleRow) throw new Error('Forbidden: Admin access required');

    return user;
}

/**
 * Creates a new user with Supabase Auth, a profile, and role entries.
 *
 * Requires ADMIN privileges.
 *
 * @param data - The user data (email, name, roles, password, optional orgId).
 * @returns The created user object.
 */
export async function createUser(data: {
    email: string;
    password?: string;
    name: string;
    roles: string[];
    orgId?: string;
}) {
    await ensureAdmin();
    const supabaseAdmin = await createAdminClient();

    // 1. Create Auth User
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password || undefined,
        email_confirm: true, // Auto-confirm email so the user can log in immediately
    });

    if (authError) throw new Error(authError.message);
    if (!authUser.user) throw new Error('Failed to create user');

    // 2. Upsert Profile (id + name + email only — no role/roles columns)
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: authUser.user.id,
            email: data.email,
            name: data.name,
        });

    if (profileError) {
        throw new Error('Failed to create profile: ' + profileError.message);
    }

    // 3. Insert role rows into `user_roles` (one row per role)
    if (data.roles && data.roles.length > 0) {
        const roleRows = data.roles.map((role) => ({
            user_id: authUser.user!.id,
            role,
            organization_id: data.orgId || null,
        }));

        const { error: rolesError } = await supabaseAdmin
            .from('user_roles')
            .insert(roleRows);

        if (rolesError) {
            throw new Error('Failed to assign roles: ' + rolesError.message);
        }
    }

    revalidatePath('/admin/users');
    return { success: true, user: authUser.user };
}

/**
 * Updates an existing user's profile name and/or password.
 * Role updates replace all existing role rows for the user.
 *
 * Requires ADMIN privileges.
 *
 * @param id - The auth user ID to update.
 * @param data - Fields to update (name, roles, password, optional orgId).
 */
export async function updateUser(id: string, data: {
    name?: string;
    roles?: string[];
    password?: string;
    orgId?: string;
}) {
    await ensureAdmin();
    const supabaseAdmin = await createAdminClient();

    // 1. Update Profile name (profiles only stores id, name, email)
    if (data.name) {
        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update({ name: data.name })
            .eq('id', id);

        if (profileError) throw new Error('Failed to update profile: ' + profileError.message);
    }

    // 2. Replace role rows when new roles are provided
    if (data.roles && data.roles.length > 0) {
        // Delete existing roles for this user first (full replace strategy)
        const { error: deleteError } = await supabaseAdmin
            .from('user_roles')
            .delete()
            .eq('user_id', id);

        if (deleteError) throw new Error('Failed to clear existing roles: ' + deleteError.message);

        // Insert the new role set
        const roleRows = data.roles.map((role) => ({
            user_id: id,
            role,
            organization_id: data.orgId || null,
        }));

        const { error: rolesError } = await supabaseAdmin
            .from('user_roles')
            .insert(roleRows);

        if (rolesError) throw new Error('Failed to assign roles: ' + rolesError.message);
    }

    // 3. Update password via Auth admin API
    if (data.password) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
            password: data.password,
        });
        if (authError) throw new Error('Failed to update password: ' + authError.message);
    }

    revalidatePath('/admin/users');
    return { success: true };
}

/**
 * Deletes a user by ID from both Auth and the database.
 * Cascade on `user_roles` and `profiles` handles cleanup.
 *
 * Requires ADMIN privileges.
 *
 * @param id - The auth user ID to delete.
 */
export async function deleteUser(id: string) {
    await ensureAdmin();
    const supabaseAdmin = await createAdminClient();

    // Deleting from Auth cascades to profiles and user_roles via ON DELETE CASCADE FKs
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);
    if (error) throw new Error(error.message);

    revalidatePath('/admin/users');
    return { success: true };
}
