'use server';

import { createClient } from '@/lib/supabase/server';
import { SchoolHoliday } from '@/lib/classroomUtils';

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

export async function deleteHoliday(id: string) {
    const supabase = await createClient();
    const { error } = await supabase
        .from('school_holidays')
        .delete()
        .eq('id', id);

    if (error) throw new Error(error.message);
    return true;
}
