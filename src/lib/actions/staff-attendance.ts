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

/**
 * Clocks in a staff member.
 * 
 * Checks for existing clock-ins, verifies active status, and links to the current pay period.
 */
export async function clockIn(staffId: string, options?: { lat?: number, lng?: number, qrCode?: string }) {
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

    // Validate QR code if provided
    let isLocationVerified = !!(options?.lat && options?.lng);
    
    if (options?.qrCode && orgId) {
        const { data: qrConfig } = await supabase
            .from('school_qr_config')
            .select('code_value')
            .eq('organization_id', orgId)
            .eq('active', true)
            .single();
            
        if (qrConfig && qrConfig.code_value === options.qrCode) {
            isLocationVerified = true;
        } else {
            return { success: false, message: 'Invalid or expired QR code' };
        }
    }

    // 4. Create Attendance Record
    const { error: insertError } = await supabase.from('staff_attendance').insert({
        staff_id: staffId,
        date: today,
        status: 'PRESENT', // Default
        check_in: new Date().toISOString(),
        location_verified: isLocationVerified,
        location_lat: options?.lat,
        location_lng: options?.lng,
        pay_period_id: payPeriodId
    });

    if (insertError) {
        return { success: false, message: 'Failed to clock in: ' + insertError.message };
    }

    revalidatePath('/dashboard');
    revalidatePath('/admin/staff-attendance');
    return { success: true, message: 'Clocked in successfully' };
}

/**
 * Clocks out a staff member.
 * 
 * Calculates duration and applies break logic (deduct 30 mins if > 5.5 hours).
 */
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

/**
 * Auto-closes any shifts from previous days that were left abandoned (no check_out).
 * Sets the check_out to midnight of that same day (or checks out immediately with status='AUTO_CLOSED').
 * For simplicity, we just mark check_out as check_in + 8 hours and status=LATE_CHECKOUT or something,
 * but for this we'll just set check_out = check_in + 8h and save it to prevent blocking today.
 */
export async function autoCloseOpenShiftIfOld(userId: string) {
    const supabase = await createClient();
    
    // 1. Find the staff record linked to this auth user
    const { data: staff } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
        
    if (!staff) return 0;
    
    const today = new Date().toISOString().split('T')[0];
    
    // 2. Find any open records strictly before today
    const { data: oldShifts } = await supabase
        .from('staff_attendance')
        .select('id, check_in')
        .eq('staff_id', staff.id)
        .is('check_out', null)
        .lt('date', today);
        
    if (!oldShifts || oldShifts.length === 0) return 0;
    
    // 3. Close them out (set check_out to 8h after check_in, logic can be tuned)
    for (const shift of oldShifts) {
        const checkInDate = new Date(shift.check_in);
        const forceCheckOut = new Date(checkInDate.getTime() + 8 * 60 * 60 * 1000); // +8h
        
        await supabase
            .from('staff_attendance')
            .update({
                check_out: forceCheckOut.toISOString(),
                work_minutes: 8 * 60,
                notes: 'AUTO-CLOSED: Forgot to clock out previous day.'
            })
            .eq('id', shift.id);
    }
    
    return oldShifts.length;
}

/**
 * Gets the clock-in status for a staff member for today.
 */
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

/**
 * Fetches all attendance records for a staff member within a specific pay period.
 */
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

/**
 * Returns the clock-in state for the currently logged-in user.
 *
 * Used by the global ClockInPromptProvider to decide whether to show the prompt.
 * Resolves the user → staff link via staff.user_id.
 *
 * Possible states:
 *  - hasStaffRecord: false  → user is not staff, skip prompt
 *  - isClockedIn: false     → staff, but hasn't clocked in yet today → show prompt
 *  - isShiftDone: true      → already clocked in AND out → skip prompt
 *  - isClockedIn: true, isShiftDone: false → currently working → skip prompt
 */
export async function getStaffClockInStatus(userId: string): Promise<{
    hasStaffRecord: boolean;
    staffId: string | null;
    isClockedIn: boolean;
    isShiftDone: boolean;
    record: Record<string, unknown> | null;
}> {
    const supabase = await createClient();

    // 1. Find the staff record linked to this auth user
    const { data: staff, error: staffError } = await supabase
        .from('staff')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

    if (staffError || !staff) {
        return { hasStaffRecord: false, staffId: null, isClockedIn: false, isShiftDone: false, record: null };
    }

    // 2. Check today's attendance record
    const today = new Date().toISOString().split('T')[0];
    const { data: record, error: recordError } = await supabase
        .from('staff_attendance')
        .select('id, check_in, check_out, status')
        .eq('staff_id', staff.id)
        .eq('date', today)
        .maybeSingle();

    if (recordError) {
        // Fail open — don't show the prompt if we can't determine status
        return { hasStaffRecord: true, staffId: staff.id, isClockedIn: false, isShiftDone: false, record: null };
    }

    const isClockedIn = !!record?.check_in;
    const isShiftDone = isClockedIn && !!record?.check_out;

    return {
        hasStaffRecord: true,
        staffId: staff.id,
        isClockedIn,
        isShiftDone,
        record: record ?? null,
    };
}
