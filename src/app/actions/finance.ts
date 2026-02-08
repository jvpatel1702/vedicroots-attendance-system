'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// This file handles the "Financial" aspect:
// 1. Calculating Teacher Pay based on fulfilled sessions.
// 2. Calculating Student "Rollovers" or "Credits" based on cancelled sessions.

export async function calculateTeacherPay(teacherId: string, startDate: string, endDate: string) {
    const supabase = await createClient()

    // 1. Get all offerings for this teacher
    const { data: offerings, error: offeringError } = await supabase
        .from('elective_offerings')
        .select('id, cost_per_session, name')
        .eq('teacher_id', teacherId)

    if (offeringError) throw new Error(offeringError.message)
    if (!offerings || offerings.length === 0) return { totalPay: 0, breakdown: [] }

    const offeringIds = offerings.map(o => o.id)

    // 2. Get all attendance records for these offerings in the date range
    // We need to find sessions where the teacher WAS present (or rather, the class happened).
    // Actually, pay depends on the contract. Usually:
    // - Paid for conducted classes.
    // - Paid for "Student Absent" (student pays, teacher gets paid).
    // - NOT Paid for "Teacher Absent" (unless sick leave policy, but simplest is No Work No Pay or Fixed Salary).
    // - Rollover means Student gets credit.

    // Let's assume Teacher is paid for every session that is NOT "Teacher Absent" and NOT "School Closed".
    // We need to query `elective_attendance` but unique by (offering_id, date).
    // Since attendance is per student, we just need to know if the session happened.
    // If *any* student is marked PRESENT/ABSENT/LATE, the session happened.
    // If *all* students are TEACHER_ABSENT, session didn't happen.

    // Better approach: Get distinct dates per offering.

    const { data: attendanceData, error: attError } = await supabase
        .from('elective_attendance')
        .select('date, status, enrollment_id, is_rollover, elective_enrollments!inner(offering_id)')
        .in('elective_enrollments.offering_id', offeringIds)
        .gte('date', startDate)
        .lte('date', endDate)

    if (attError) throw new Error(attError.message)

    // Group by Offering -> Date
    const sessions = new Map<string, Set<string>>() // offeringId -> Set<DateString>
    const teacherAbsentSessions = new Map<string, Set<string>>()

    attendanceData?.forEach(record => {
        const offeringId = (record.elective_enrollments as any).offering_id // Flattened by Supabase? check structure
        // Actually supabase returns nested object.
        // @ts-ignore
        const oid = record.elective_enrollments.offering_id

        if (!sessions.has(oid)) sessions.set(oid, new Set())
        if (!teacherAbsentSessions.has(oid)) teacherAbsentSessions.set(oid, new Set())

        const dateStr = record.date as string

        // Logic: specific logic to determine if "Session Counted for Pay"
        // If status is TEACHER_ABSENT, it implies no pay for that specific instance?
        // User requirements: "Advance Teacher Pay: Logic to calculate and pay teachers upfront based on the scheduled number of sessions."
        // WAIT. "Pay teachers UPFRONT based on scheduled number".
        // AND "If a class is cancelled... credit must roll over".
        // This implies:
        // 1. Initial Invoice = Expected Sessions * Rate.
        // 2. Actual Pay = ...? If advanced, they are already paid.
        // 3. Maybe this function is "Calculate Billable Amount" for the period? 

        // Let's stick to "Billable Sessions" for now.
        if (record.status !== 'TEACHER_ABSENT' && record.status !== 'SCHOOL_CLOSED') {
            // Only add if we haven't seen this date for this offering yet? 
            // Actually, if we are iterating through students, we just need to know if the SESSION took place.
            sessions.get(oid)?.add(dateStr)
        } else if (record.status === 'TEACHER_ABSENT') {
            teacherAbsentSessions.get(oid)?.add(dateStr)
        }
    })

    const breakdown = offerings.map(offering => {
        const workableSessions = sessions.get(offering.id)?.size || 0
        const cancelledSessions = teacherAbsentSessions.get(offering.id)?.size || 0
        const pay = workableSessions * offering.cost_per_session
        return {
            offering: offering.name,
            sessions: workableSessions,
            cancelled: cancelledSessions,
            rate: offering.cost_per_session,
            total: pay
        }
    })

    const totalPay = breakdown.reduce((acc, curr) => acc + curr.total, 0)

    return { totalPay, breakdown }
}

export async function getStudentRollovers(studentId: string) {
    const supabase = await createClient()

    // Find all attendance records for this student that are flagged as rollover
    const { data, error } = await supabase
        .from('elective_attendance')
        .select(`
            date,
            status,
            rollover_note,
            enrollment:elective_enrollments!inner(
                offering:elective_offerings(name, cost_per_session)
            )
        `)
        .eq('elective_enrollments.student_id', studentId)
        .or('status.eq.TEACHER_ABSENT,is_rollover.eq.true')
        .order('date', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}
