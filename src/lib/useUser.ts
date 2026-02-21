'use client';

import { useEffect, useState } from 'react';
import { createClient } from './supabaseClient';
import { User } from '@supabase/supabase-js';

/**
 * Extends the Supabase User type with app-specific profile data.
 */
export interface AppUser extends Partial<User> {
    id: string;
    email?: string;
    /** The role of the user, fetched from the `profiles` table (e.g., 'ADMIN', 'TEACHER', 'OFFICE') */
    role?: string;
    /** All roles assigned to the user, if multi-role is enabled */
    roles?: string[];
}

/**
 * Custom hook to fetch and provide the current authenticated user,
 * including their role from the `profiles` table.
 *
 * Role is ALWAYS fetched server-side from the database — never trusted from
 * client-side state, cookies, or localStorage.
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

            // Fetch the role from the profiles table — never trust client-side state
            const { data: profile } = await supabase
                .from('profiles')
                .select('role, roles')
                .eq('id', authUser.id)
                .single();

            setUser({
                ...authUser,
                role: profile?.role ?? undefined,
                roles: profile?.roles ?? undefined,
            });

            setLoading(false);
        }
        getUser();
    }, []);

    return { user, loading };
}
