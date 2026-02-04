import { useEffect, useState } from 'react';
import { createClient } from './supabaseClient';
import { User } from '@supabase/supabase-js';

// Define a robust User type that includes Supabase User properties we use
export interface AppUser extends Partial<User> {
    id: string;
    email?: string;
    role?: string;
}

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
