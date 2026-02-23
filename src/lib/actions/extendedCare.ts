'use server';

import { createClient } from '@/lib/supabase/server';
import { parseISO, getDaysInMonth, startOfMonth, endOfMonth, isBefore, isAfter, getDate, getDay, format } from 'date-fns';

interface CalculationRequest {
    studentId: string;
    organizationId: string;
    month: string; // 'yyyy-MM-dd' (first of month)
    startDate?: string; // Opt-in start date for proration
    dropOffTime: string; // 'HH:mm'
    pickupTime: string; // 'HH:mm'
    selectedDays: string[]; // ['Mon', 'Tue', ...]
    transportMode: string;
    manualAdjustment: number;
}

interface ActivityInfo {
    id: string;
    name: string;
    day: string;
    startTime: string;
    endTime: string;
    isSibling: boolean;
}

interface CalculationResult {
    breakdown: {
        morningCycles: number;
        afternoonCycles: number;
        dailyBaseCycles: number;
        ratePerCyclePerDay: number;
        grossFee: number;
        refinedGrossFee: number;
        prorationFactor: number;
        deductions: Array<{
            day: string;
            reason: string;
            cycles: number;
            amount: number;
        }>;
    };
    activities: ActivityInfo[]; // Return list of relevant activities for UI
    finalFee: number;
}

const dayMap: { [key: string]: string } = { 'Mon': 'MONDAY', 'Tue': 'TUESDAY', 'Wed': 'WEDNESDAY', 'Thu': 'THURSDAY', 'Fri': 'FRIDAY' };
const dayIndexMap: { [key: string]: number } = { 'Mon': 1, 'Tue': 2, 'Wed': 3, 'Thu': 4, 'Fri': 5 };

/**
 * Calculates the extended care fee for a student for a specific month.
 * 
 * This complex function handles:
 * 1. Determining applicable rates and cutoff times based on grade (Kindergarten vs Elementary).
 * 2. Calculating billable cycles (30-min blocks) before drop-off and after pick-up.
 * 3. Prorating fees based on the number of working days in the month vs remaining working days.
 * 4. Deducting time for conflicting activities (Electives, Taxi).
 * 5. Applying sibling discounts (if implied by logic, though mostly activity deductions here).
 * 
 * @param req - The calculation request parameters.
 * @returns The detailed calculation result including breakdown and final fee.
 */
export async function calculateExtendedCareFee(req: CalculationRequest): Promise<CalculationResult> {
    const supabase = await createClient();
    console.log('Calculating Extended Care Fee for:', req.organizationId);
    // 1. Fetch student's active enrollment → grade → program_id
    const { data: enrollment } = await supabase
        .from('enrollments')
        .select('grade:grades(name, program_id), start_date, end_date')
        .eq('student_id', req.studentId)
        .eq('status', 'ACTIVE')
        .maybeSingle();

    const grade = (enrollment && 'grade' in enrollment)
        ? (Array.isArray(enrollment.grade) ? enrollment.grade[0] : enrollment.grade)
        : null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const programId: string | null = (grade as any)?.program_id ?? null;

    if (!programId) throw new Error('Could not determine program for student. Check enrollment.');

    // 2. Fetch Settings from program_settings (per-program flat columns)
    const { data: settings } = await supabase
        .from('program_settings')
        .select('*')
        .eq('program_id', programId)
        .eq('organization_id', req.organizationId)
        .single();

    if (!settings) throw new Error('Program settings not found. Please configure them in Settings.');

    const rateMonthly = Number(settings.extended_care_rate_monthly) || 80;
    const ratePerCyclePerDay = rateMonthly / 5; // e.g., $16

    // Each program row already holds the correct times for that grade level.
    // No KG vs Elementary branching needed — program_settings is per-program.
    const regDropOff = settings.dropoff_time || '08:30';
    let regPickup = settings.pickup_time || '15:20';

    // Validate enrollment dates against billing month
    const isKg = grade?.name?.toUpperCase().includes('K') || false; // kept for any downstream logic

    // Taxi Logic
    if (req.transportMode === 'TAXI') {
        regPickup = '16:30';
    }

    // 3. Calculate Base Cycles
    const toMinutes = (timeStr: string) => {
        const [h, m] = timeStr.split(':').map(Number);
        return h * 60 + m;
    };

    const actualDropMins = toMinutes(req.dropOffTime);
    const regDropMins = toMinutes(regDropOff.slice(0, 5));
    const morningDiff = Math.max(0, regDropMins - actualDropMins);
    const morningCycles = morningDiff / 30;

    const actualPickupMins = toMinutes(req.pickupTime);
    const regPickupMins = toMinutes(regPickup.slice(0, 5));
    const afternoonDiff = Math.max(0, actualPickupMins - regPickupMins);
    const afternoonCycles = afternoonDiff / 30;

    const dailyBaseCycles = morningCycles + afternoonCycles;
    const grossFee = dailyBaseCycles * ratePerCyclePerDay * req.selectedDays.length; // Full Monthly Gross

    // 4. Proration Logic (Working Days / Total Working Days)
    // Working Days = Weekdays (Mon-Fri) - Holidays
    const billingMonthStart = parseISO(req.month);
    const billingMonthEnd = endOfMonth(billingMonthStart);
    const effectiveStart = req.startDate ? parseISO(req.startDate) : billingMonthStart;

    // Ensure effective start is within the month
    const realStart = isBefore(effectiveStart, billingMonthStart) ? billingMonthStart : effectiveStart;

    // Fetch Holidays for this month
    const { data: holidays } = await supabase
        .from('school_holidays')
        .select('start_date, end_date')
        .eq('organization_id', req.organizationId)
        .gte('end_date', req.month) // Holiday ends after month start
        .lte('start_date', format(billingMonthEnd, 'yyyy-MM-dd')); // Holiday starts before month end

    // Helper to check if a date is a holiday
    const isHoliday = (date: Date) => {
        if (!holidays) return false;
        const dateStr = format(date, 'yyyy-MM-dd');
        return holidays.some(h => dateStr >= h.start_date && dateStr <= h.end_date);
    };

    // Helper to check if a date is a working day (Mon-Fri AND not a holiday)
    const isWorkingDay = (date: Date) => {
        const day = getDay(date);
        if (day === 0 || day === 6) return false; // Weekend
        if (isHoliday(date)) return false;
        return true;
    };

    let totalWorkingDays = 0;
    let workingDaysRemaining = 0;

    const daysInMonth = getDaysInMonth(billingMonthStart);
    for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(billingMonthStart.getFullYear(), billingMonthStart.getMonth(), d);

        if (isWorkingDay(date)) {
            totalWorkingDays++;
            // Check if this working day is on or after realStart
            // Using isBefore(date, realStart) is tricky with times.
            // Compare string formats to be safe or ensure midnight.
            if (format(date, 'yyyy-MM-dd') >= format(realStart, 'yyyy-MM-dd')) {
                workingDaysRemaining++;
            }
        }
    }

    // Proration Factor = Working Days Remaining / Total Working Days in Month
    // If start date is day 1, factor should be 1.
    const prorationFactor = totalWorkingDays > 0 ? (workingDaysRemaining / totalWorkingDays) : 0;
    console.log(`Proration: ${workingDaysRemaining}/${totalWorkingDays} working days. Factor: ${prorationFactor}`);

    // 5. Calculate Deductions via Exclusion Ranges & Gather Activities
    const activitiesList: ActivityInfo[] = [];

    // A. Fetch Student Electives
    const { data: electives } = await supabase
        .from('elective_enrollments')
        .select(`
            offering:elective_offerings (
                id, subject:elective_subjects(name),
                schedule_day, schedule_start_time, schedule_end_time
            )
        `)
        .eq('student_id', req.studentId)
        .eq('status', 'ACTIVE');

    electives?.forEach((e: any) => {
        const offering = Array.isArray(e.offering) ? e.offering[0] : e.offering;
        if (!offering) return;

        const subject = Array.isArray(offering.subject) ? offering.subject[0] : offering.subject;
        const subjectName = subject?.name || 'Unknown Subject';

        activitiesList.push({
            id: offering.id,
            name: subjectName,
            day: offering.schedule_day,
            startTime: offering.schedule_start_time,
            endTime: offering.schedule_end_time,
            isSibling: false
        });
    });

    // B. Fetch Sibling Electives
    const { data: guardians } = await supabase
        .from('student_guardians')
        .select('guardian_id')
        .eq('student_id', req.studentId);

    const guardianIds = guardians?.map(g => g.guardian_id) || [];

    let siblingElectives: any[] = [];
    if (guardianIds.length > 0) {
        const { data: siblings } = await supabase
            .from('student_guardians')
            .select('student_id')
            .in('guardian_id', guardianIds)
            .neq('student_id', req.studentId);

        const siblingIds = siblings?.map(s => s.student_id) || [];

        if (siblingIds.length > 0) {
            const { data: sibE } = await supabase
                .from('elective_enrollments')
                .select(`
                    offering:elective_offerings (
                        id, subject:elective_subjects(name),
                        schedule_day, schedule_start_time, schedule_end_time
                    )
                `)
                .in('student_id', siblingIds)
                .eq('status', 'ACTIVE');
            siblingElectives = sibE || [];

            siblingElectives.forEach((e: any) => {
                const offering = Array.isArray(e.offering) ? e.offering[0] : e.offering;
                if (!offering) return;

                const subject = Array.isArray(offering.subject) ? offering.subject[0] : offering.subject;
                const subjectName = subject?.name || 'Unknown Subject';

                activitiesList.push({
                    id: offering.id,
                    name: `Sibling: ${subjectName}`,
                    day: offering.schedule_day,
                    startTime: offering.schedule_start_time,
                    endTime: offering.schedule_end_time,
                    isSibling: true
                });
            });
        }
    }

    // Process Fee with Deductions
    let refinedGrossFee = 0;

    req.selectedDays.forEach(dayShort => {
        const dayFull = dayMap[dayShort];

        // Base Billable Ranges
        let billableRanges: [number, number][] = [];
        if (regDropMins > actualDropMins) billableRanges.push([actualDropMins, regDropMins]);
        if (actualPickupMins > regPickupMins) billableRanges.push([regPickupMins, actualPickupMins]);

        // Exclusions
        let exclusions: [number, number][] = [];
        activitiesList.filter(a => a.day === dayFull).forEach(a => {
            exclusions.push([toMinutes(a.startTime), toMinutes(a.endTime)]);
        });

        // Calculate Deducted Minutes
        let dailyBillableMins = 0;
        billableRanges.forEach(([bStart, bEnd]) => {
            let parts: [number, number][] = [[bStart, bEnd]];
            exclusions.forEach(([exStart, exEnd]) => {
                const newParts: [number, number][] = [];
                parts.forEach(([pStart, pEnd]) => {
                    if (exEnd <= pStart || exStart >= pEnd) {
                        newParts.push([pStart, pEnd]);
                    } else {
                        if (pStart < exStart) newParts.push([pStart, exStart]);
                        if (pEnd > exEnd) newParts.push([exEnd, pEnd]);
                    }
                });
                parts = newParts;
            });
            parts.forEach(([pStart, pEnd]) => dailyBillableMins += (pEnd - pStart));
        });

        const dailyCycles = dailyBillableMins / 30;
        refinedGrossFee += dailyCycles * ratePerCyclePerDay;
    });

    // Apply Proration
    const proratedRefinedFee = refinedGrossFee * prorationFactor;
    const proratedGrossFee = grossFee * prorationFactor;

    // Manual Adjustment (can be + or -)
    // adjustment is ADDED. So negative value reduces fee.
    const adjustment = Number(req.manualAdjustment) || 0;
    const finalFee = Math.max(0, proratedRefinedFee + adjustment);
    const deductionAmount = proratedGrossFee - proratedRefinedFee;

    return {
        breakdown: {
            morningCycles,
            afternoonCycles,
            dailyBaseCycles,
            ratePerCyclePerDay,
            grossFee: proratedGrossFee, // Return the prorated gross for clearer comparison
            refinedGrossFee: proratedRefinedFee,
            prorationFactor,
            deductions: deductionAmount > 0 ? [{
                day: 'Calculated',
                reason: 'Activities/Sibling/Taxi',
                cycles: deductionAmount / ratePerCyclePerDay,
                amount: deductionAmount
            }] : [],
        },
        activities: activitiesList,
        finalFee
    };
}

/**
 * Saves the extended care enrollment and fee information.
 * 
 * First recalculates the fee to ensure data integrity, then upserts the record.
 */
export async function saveExtendedCareEnrollment(req: CalculationRequest & { manualAdjustmentReason?: string }) {
    const supabase = await createClient();
    const calc = await calculateExtendedCareFee(req);

    const { data, error } = await supabase
        .from('extended_care_enrollments')
        .upsert({
            student_id: req.studentId,
            month: req.month,
            start_date: req.startDate || req.month, // Save start date
            drop_off_time: req.dropOffTime,
            pickup_time: req.pickupTime,
            days_of_week: req.selectedDays,
            // Better to keep schema stable and just store value. 
            // If DB column is discount, positive adjustment (surcharge) might need negative storage if logic implies subtraction?
            // Wait, schema says "manual_discount_amount". 
            // If I store +50 as discount_amount, usually that means fee - 50.
            // If I want +50 to be surcharge, I should store -50 as discount?
            // Let's negate it so the DB column "discount" logic (fee - discount) works for adjustment (fee + adjustment).
            // Adjustment +50 -> Discount -50.   Fee - (-50) = Fee + 50. Correct.
            // Adjustment -50 -> Discount +50.   Fee - (+50) = Fee - 50. Correct.
            manual_discount_amount: -(req.manualAdjustment || 0),
            manual_discount_reason: req.manualAdjustmentReason,
            final_fee: calc.finalFee,
            audit_log: calc.breakdown
        }, {
            onConflict: 'student_id, month, start_date' // Updated constraint
        })
        .select()
        .single();

    if (error) throw new Error(error.message);
    return data;
}
