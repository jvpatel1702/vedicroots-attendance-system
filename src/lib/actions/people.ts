'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Fetches all user profiles ordered by name.
 * 
 * @returns A list of all profiles.
 */
export async function getProfiles() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name')

    if (error) throw new Error(error.message)
    return data
}

/**
 * Fetches all profiles with the 'TEACHER' role.
 * Roles live in the `user_roles` junction table, not on `profiles` directly.
 *
 * @returns A list of teacher profiles.
 */
export async function getTeachers() {
    const supabase = await createClient()
    // Join via user_roles since profiles has no role column
    const { data, error } = await supabase
        .from('user_roles')
        .select('profiles!user_id(id, name, email)')
        .eq('role', 'TEACHER')

    if (error) throw new Error(error.message)
    return (data ?? []).map((r: any) => r.profiles).filter(Boolean)
}
