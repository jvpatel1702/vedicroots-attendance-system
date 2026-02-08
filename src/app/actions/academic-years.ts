'use server'

import { createClient } from '@/lib/supabase/server'

export async function getAcademicYears() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('academic_years')
        .select('*')
        .order('start_date', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}
