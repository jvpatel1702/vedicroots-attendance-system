'use server'

import { createClient } from '@/lib/supabase/server'

export async function getProfiles() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('name')

    if (error) throw new Error(error.message)
    return data
}

export async function getTeachers() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'TEACHER') // Assuming role column exists and used like this
        .order('name')

    if (error) throw new Error(error.message)
    return data
}
