import { useEffect, useState } from 'react';
import { createClient } from './supabaseClient';
import { User } from '@supabase/supabase-js';

// Define a robust User type that includes Supabase User properties we use
export interface AppUser extends Partial<User> {
    id: string;
    email?: string;
    /** The role of the user (e.g., 'ADMIN', 'TEACHER', 'OFFICE') */
    role?: string;
}

/**
 * Custom hook to fetch and provide the current user's authentication state.
 * 
 * This hook handles:
 * - Fetching the user from Supabase Auth.
 * - Simulating a development user if a 'dev_role' cookie is present.
 * - Managing loading state.
 * 
 * @returns An object containing the user object, loading state, and dev mode flag.
 */
export function useUser() {
    const [user, setUser] = useState<AppUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDev, setIsDev] = useState(false);

    useEffect(() => {
        async function getUser() {
            // Check for dev cookie
            const devRole = document.cookie.split('; ').find(row => row.startsWith('dev_role='))?.split('=')[1];

            if (devRole) {
                setIsDev(true);
                // Mock User
                setUser({
                    id: 'dev-user-id',
                    email: devRole === 'ADMIN' ? 'admin@dev.com' : 'teacher@dev.com',
                    role: devRole
                } as AppUser);
            } else {
                const supabase = createClient();
                const { data } = await supabase.auth.getUser();
                setUser(data.user as AppUser);
            }
            setLoading(false);
        }
        getUser();
    }, []);

    return { user, loading, isDev };
}
