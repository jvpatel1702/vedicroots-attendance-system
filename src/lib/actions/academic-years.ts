'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Fetches all academic years, ordered by start date (newest first).
 * 
 * @returns A list of academic years.
 */
export async function getAcademicYears() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}
