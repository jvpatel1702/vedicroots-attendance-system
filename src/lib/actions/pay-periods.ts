'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Generates and saves pay periods for a given year and frequency.
 * 
 * @param organizationId - The organization ID.
 * @param year - The year to generate periods for.
 * @param frequency - 'WEEKLY', 'BIWEEKLY', or 'MONTHLY'.
 */
export async function createPayPeriods(organizationId: string, year: number, frequency: 'WEEKLY' | 'BIWEEKLY' | 'MONTHLY') {
    const supabase = await createClient();

    // Check if admin
    // ... middleware/RLS handles some, but logic here:

    // Generate dates
    const periods = [];
    let start = new Date(year, 0, 1);

    // Adjustment for start of week if Weekly? 
    // For simplicity, let's just start Jan 1.

    while (start.getFullYear() === year) {
        let end = new Date(start);

        if (frequency === 'WEEKLY') {
            end.setDate(start.getDate() + 6);
        } else if (frequency === 'BIWEEKLY') {
            end.setDate(start.getDate() + 13);
        } else if (frequency === 'MONTHLY') {
            end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
        }

        // Cap at year end?
        if (end.getFullYear() > year) {
            end = new Date(year, 11, 31);
        }

        const name = `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;

        periods.push({
            organization_id: organizationId,
            name,
            start_date: start.toISOString().split('T')[0],
            end_date: end.toISOString().split('T')[0],
            status: 'OPEN'
        });

        // Next start
        start = new Date(end);
        start.setDate(start.getDate() + 1);
    }

    const { error } = await supabase.from('pay_periods').insert(periods);

    if (error) {
        return { success: false, message: error.message };
    }

    revalidatePath('/admin/pay-periods');
    return { success: true, message: `Created ${periods.length} pay periods for ${year}` };
}

/**
 * Fetches all pay periods for an organization.
 */
export async function getPayPeriods(organizationId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
        .from('pay_periods')
        .select('*')
        .eq('organization_id', organizationId)
        .order('start_date', { ascending: false });

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}

/**
 * Gets the current active pay period based on today's date.
 */
export async function getCurrentPayPeriod(organizationId: string) {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('pay_periods')
        .select('*')
        .eq('organization_id', organizationId)
        .lte('start_date', today)
        .gte('end_date', today)
        .single();

    if (error) return { success: false, error: error.message };
    return { success: true, data };
}
