import { createClient } from '@supabase/supabase-js';

export const createAdminClient = async () => {
    // Create a direct client with the service role key
    // This client has admin privileges and bypasses RLS completely
    // It does NOT use cookies or user sessions to interfere with auth state
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    );
};
