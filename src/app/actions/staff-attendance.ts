'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

// Helper to determine status based on time
const determineStatus = (checkInTime: string, scheduledStartTime: string): string => {
    // Basic logic for now - could be enhanced with schedule comparison
    // If checkIn > scheduled + grace_period -> LATE
    // For now, default to PRESENT
    return 'PRESENT';
};

export async function clockIn(staffId: string, locationData?: { lat: number, lng: number }) {
    const supabase = await createClient();

    // 1. Verify staff exists and is active
    const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('*')
        .eq('id', staffId)
        .eq('is_active', true)
        .single();

    if (staffError || !staff) {
        return { success: false, message: 'Staff not found or inactive' };
    }

    // 2. Check if already clocked in today
    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('staff_id', staffId)
        .eq('date', today)
        .single();

    if (existing) {
        return { success: false, message: 'Already clocked in for today' };
    }

    // 3. Get current or next open pay period
    // Simple logic: Find open pay period covering today
    const { data: payPeriod } = await supabase
        .from('pay_periods')
        .select('id')
        .eq('organization_id', staff.organization_id) // Assuming staff has org_id via person or we query it
        .eq('status', 'OPEN')
        .lte('start_date', today)
        .gte('end_date', today)
        .single();

    // Note: Staff table migration in 20260207000000_staff_management.sql doesn't seem to have organization_id directly on staff?
    // It links to person, which has organization_id.
    // Let's resolve organization_id from person.

    let orgId = null;
    if (staff.person_id) {
        const { data: person } = await supabase.from('persons').select('organization_id').eq('id', staff.person_id).single();
        if (person) orgId = person.organization_id;
    }

    let payPeriodId = payPeriod?.id;

    // If no pay period found, we might want to still allow clock in but warn or create one? 
    // For now, allow null pay_period_id if not found (or strict mode?)

    // 4. Create Attendance Record
    const { error: insertError } = await supabase.from('staff_attendance').insert({
        staff_id: staffId,
        date: today,
        status: 'PRESENT', // Default
        check_in: new Date().toISOString(),
        location_verified: !!locationData,
        location_lat: locationData?.lat,
        location_lng: locationData?.lng,
        pay_period_id: payPeriodId
    });

    if (insertError) {
        return { success: false, message: 'Failed to clock in: ' + insertError.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/admin/staff-attendance');
    return { success: true, message: 'Clocked in successfully' };
}

export async function clockOut(staffId: string, locationData?: { lat: number, lng: number }) {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    // 1. Find today's open record
    const { data: record, error: recordError } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('staff_id', staffId)
        .eq('date', today)
        .is('check_out', null)
        .single();

    if (recordError || !record) {
        return { success: false, message: 'No active clock-in found for today' };
    }

    const checkOutTime = new Date();
    const checkInTime = new Date(record.check_in);

    // Calculate Duration in minutes
    const durationMs = checkOutTime.getTime() - checkInTime.getTime();
    const durationMinutes = Math.floor(durationMs / 60000); // Minutes

    // Break Logic: If > 5.5 hours (330 mins), deduct 30 mins
    let breakMinutes = 0;
    let breakDeducted = false;
    let workMinutes = durationMinutes;

    if (durationMinutes >= 330) {
        breakMinutes = 30;
        breakDeducted = true;
        workMinutes = durationMinutes - breakMinutes;
    }

    // 2. Update Record
    const { error: updateError } = await supabase
        .from('staff_attendance')
        .update({
            check_out: checkOutTime.toISOString(),
            work_minutes: workMinutes,
            break_minutes: breakMinutes,
            break_deducted: breakDeducted,
            // Update location out? Maybe not needed, or update if we track out location
        })
        .eq('id', record.id);

    if (updateError) {
        return { success: false, message: 'Failed to clock out: ' + updateError.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/admin/staff-attendance');
    return { success: true, message: 'Clocked out successfully' };
}

export async function getTodayStatus(staffId: string) {
    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('staff_id', staffId)
        .eq('date', today)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is 'not found'
        return { success: false, error: error.message };
    }

    return { success: true, record: data };
}

export async function getPayPeriodAttendance(staffId: string, payPeriodId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('staff_attendance')
        .select('*')
        .eq('staff_id', staffId)
        .eq('pay_period_id', payPeriodId)
        .order('date', { ascending: false });

    if (error) {
        return { success: false, error: error.message };
    }
    return { success: true, records: data };
}
