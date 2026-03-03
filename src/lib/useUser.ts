'use client';

import { useEffect, useState } from 'react';
import { createClient } from './supabaseClient';
import { User } from '@supabase/supabase-js';

/**
 * Extends the Supabase User type with app-specific role data.
 * Roles come exclusively from the `user_roles` table (not `profiles`).
 */
export interface AppUser extends Partial<User> {
    id: string;
    email?: string;
    /** Primary (highest-priority) role for the user derived from user_roles */
    role?: string;
    /** All roles assigned to the user via the user_roles junction table */
    roles?: string[];
}

/**
 * Custom hook to fetch and provide the current authenticated user,
 * including their roles from the `user_roles` table.
 *
 * NOTE: `profiles.role` and `profiles.roles` do NOT exist in the DB schema.
 * All role data lives exclusively in the `user_roles` junction table.
 *
 * @returns An object containing the user object and loading state.
 */
export function useUser() {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function getUser() {
            const supabase = createClient();
            const { data: { user: authUser } } = await supabase.auth.getUser();

            if (!authUser) {
                setUser(null);
                setLoading(false);
                return;
            }

            // Fetch all roles for this user from user_roles (a user may have multiple)
            const ROLE_PRIORITY = ['ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN', 'OFFICE', 'TEACHER', 'PARENT'];

            const { data: roleRows } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', authUser.id);

            const roles = roleRows?.map((r: any) => r.role as string) ?? [];
            // Pick the most privileged role as the primary role
            const primaryRole = ROLE_PRIORITY.find(r => roles.includes(r)) ?? roles[0];

            setUser({
                ...authUser,
                role: primaryRole,
                roles,
            });

            setLoading(false);
        }
        getUser();
    }, []);

    return { user, loading };
}
