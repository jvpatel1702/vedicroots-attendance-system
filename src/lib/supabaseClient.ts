import { createBrowserClient } from '@supabase/ssr'

/**
 * Creates a Supabase client for client-side usage.
 * 
 * @returns A Supabase client instance using the anonymous key.
 */
export function createClient() {
    return createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
}
