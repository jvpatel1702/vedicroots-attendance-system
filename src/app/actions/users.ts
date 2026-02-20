'use server';

import { createAdminClient } from '@/lib/supabaseAdmin';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Helper to ensure current user is an Admin
 */
async function ensureAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    // Check if user has ADMIN role (handling both array and string roles logic if needed, 
    // but typically 'ADMIN' role is sufficient capability check)
    // For robust multi-role, we should check if 'ADMIN' is in roles array or is the primary role
    if (profile?.role !== 'ADMIN') {
        // Fallback check for roles array if schema is updated
        const { data: profileWithRoles } = await supabase
            .from('profiles')
            .select('roles')
            .eq('id', user.id)
            .single();

        if (!profileWithRoles?.roles?.includes('ADMIN')) {
            throw new Error('Forbidden: Admin access required');
        }
    }
    return user;
}

/**
 * Creates a new user with Supabase Auth and a corresponding profile.
 * 
 * Requires ADMIN privileges.
 * 
 * @param data - The user data (email, name, roles, password).
 * @returns The created user object.
 */
export async function createUser(data: {
    email: string;
    password?: string;
    name: string;
    roles: string[];
}) {
    await ensureAdmin();
    const supabaseAdmin = await createAdminClient();

    // 1. Create Auth User
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: data.email,
        password: data.password || undefined, // If undefined, will auto-generate or require email invite? 
        // Note: For manual creation, password is usually required or we use inviteUserByEmail
        email_confirm: true // Auto-confirm email
    });

    if (authError) throw new Error(authError.message);
    if (!authUser.user) throw new Error('Failed to create user');

    // 2. Create Profile
    // We need to use upsert because sometimes triggers might create a profile
    const { error: profileError } = await supabaseAdmin
        .from('profiles')
        .upsert({
            id: authUser.user.id,
            email: data.email,
            name: data.name,
            roles: data.roles,
            role: data.roles[0] || 'TEACHER' // Set primary role
        });

    if (profileError) {
        // cleanup auth user if profile fails? 
        // For now, just throw error
        throw new Error('Failed to create profile: ' + profileError.message);
    }

    revalidatePath('/admin/users');
    return { success: true, user: authUser.user };
}

/**
 * Updates an existing user's profile and/or password.
 * 
 * Requires ADMIN privileges.
 * 
 * @param id - The ID of the user to update.
 * @param data - The fields to update (name, roles, password).
 */
export async function updateUser(id: string, data: {
    name?: string;
    roles?: string[];
    password?: string;
}) {
    await ensureAdmin();
    const supabaseAdmin = await createAdminClient();

    // 1. Update Profile
    if (data.name || data.roles) {
        const updateData: any = {};
        if (data.name) updateData.name = data.name;
        if (data.roles) {
            updateData.roles = data.roles;
            updateData.role = data.roles[0]; // Update primary role too
        }

        const { error: profileError } = await supabaseAdmin
            .from('profiles')
            .update(updateData)
            .eq('id', id);

        if (profileError) throw new Error('Failed to update profile: ' + profileError.message);
    }

    // 2. Update Password (Auth)
    if (data.password) {
        const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(id, {
            password: data.password
        });
        if (authError) throw new Error('Failed to update password: ' + authError.message);
    }

    revalidatePath('/admin/users');
    return { success: true };
}

/**
 * Deletes a user by ID.
 * 
 * Requires ADMIN privileges.
 * 
 * @param id - The ID of the user to delete.
 */
export async function deleteUser(id: string) {
    await ensureAdmin();
    const supabaseAdmin = await createAdminClient();

    // Delete from Auth (Cascade should handle profile, but we can verify)
    const { error } = await supabaseAdmin.auth.admin.deleteUser(id);

    if (error) throw new Error(error.message);

    revalidatePath('/admin/users');
    return { success: true };
}
