import { useEffect, useState } from 'react';
import { createClient } from './supabaseClient';

export function useUser() {
    const [user, setUser] = useState<any>(null);
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
                });
            } else {
                const supabase = createClient();
                const { data } = await supabase.auth.getUser();
                setUser(data.user);
            }
            setLoading(false);
        }
        getUser();
    }, []);

    return { user, loading, isDev };
}
