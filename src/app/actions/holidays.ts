'use server';

import { createClient } from '@/lib/supabase/server';
import { SchoolHoliday } from '@/lib/classroomUtils';

/**
 * Fetches all school holidays for a specific organization.
 * 
 * @param organizationId - The ID of the organization.
 * @returns A list of school holidays ordered by start date.
 */
export async function getHolidays(organizationId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('school_holidays')
        .select('*')
        .eq('organization_id', organizationId)
        .order('start_date', { ascending: true });

    if (error) throw new Error(error.message);
    return data as SchoolHoliday[];
}

/**
 * Saves (creates or updates) a school holiday.
 * 
 * @param holiday - The holiday object to save.
 * @returns The saved holiday object.
 */
export async function saveHoliday(holiday: SchoolHoliday) {
    const supabase = await createClient();

    const holidayData: any = {
        organization_id: holiday.organization_id,
        name: holiday.name,
        start_date: holiday.start_date,
        end_date: holiday.end_date,
    };

    if (holiday.id) {
        holidayData.id = holiday.id;
    }

    console.log('Upserting holiday data:', holidayData);

    const { data, error } = await supabase
        .from('school_holidays')
        .upsert(holidayData)
        .select();

    if (error) {
        console.error('Database error in saveHoliday:', error);
        throw new Error(`Database error: ${error.message}`);
    }

    if (!data || data.length === 0) {
        console.error('No data returned from saveHoliday upsert');
        throw new Error('No data returned after save');
    }

    return data[0] as SchoolHoliday;
}

/**
 * Deletes a school holiday by ID.
 * 
 * @param id - The ID of the holiday to delete.
 * @returns True if successful.
 */
export async function deleteHoliday(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('school_holidays')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
}
