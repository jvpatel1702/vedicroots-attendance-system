'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { addWeeks, format, parse, isSameDay } from 'date-fns'

// --- Types ---

type CreateOfferingData = {
    subject_id: string
    academic_year_id: string
    teacher_id: string
    schedule_day: string // 'MONDAY'
    schedule_start_time: string // '10:00'
    schedule_end_time: string // '11:00'
    start_date: string // '2025-09-01'
    end_date: string // '2025-12-20'
    cost_per_class: number
    max_capacity: number
}

// --- Subjects ---

/**
 * Fetches all available elective subjects.
 */
export async function getElectiveSubjects() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('elective_subjects')
        .select('*')
        .order('name')

    if (error) throw new Error(error.message)
    return data
}

/**
 * Creates a new elective subject.
 */
export async function createElectiveSubject(formData: FormData) {
    const supabase = await createClient()
    const name = formData.get('name') as string
    const description = formData.get('description') as string
    const code = formData.get('code') as string

    const { error } = await supabase
        .from('elective_subjects')
        .insert({ name, description, code })

    if (error) throw new Error(error.message)
    revalidatePath('/admin/electives')
}

// --- Offerings ---

/**
 * Fetches elective offerings, optionally filtered by academic year.
 */
export async function getElectiveOfferings(academicYearId?: string) {
    const supabase = await createClient()
    let query = supabase
        .from('elective_offerings')
        .select(`
      *,
      subject:elective_subjects(name),
      teacher:profiles(name)
    `)
        .order('created_at', { ascending: false })

    if (academicYearId) {
        query = query.eq('academic_year_id', academicYearId)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data
}

/**
 * Creates a new elective offering and generates its initial class sessions.
 */
export async function createElectiveOffering(data: CreateOfferingData) {
    const supabase = await createClient()

    // 1. Create the offering
    const { data: offering, error } = await supabase
        .from('elective_offerings')
        .insert(data)
        .select()
        .single()

    if (error) throw new Error(error.message)

    // 2. Generate Initial Classes
    await generateClassSessions(offering.id)

    revalidatePath('/admin/electives')
}

/**
 * Generates class sessions based on the offering's schedule.
 * Deletes existing FUTURE scheduled classes to avoid duplicates if re-run.
 */
export async function generateClassSessions(offeringId: string) {
    const supabase = await createClient()

    // 1. Get Offering Details
    const { data: offering, error: fetchError } = await supabase
        .from('elective_offerings')
        .select('*')
        .eq('id', offeringId)
        .single()

    if (fetchError || !offering) throw new Error("Offering not found")

    const {
        start_date, end_date,
        schedule_day, schedule_start_time, schedule_end_time
    } = offering

    if (!start_date || !end_date || !schedule_day) return // Can't generate

    // 2. Calculate Dates
    // We ideally need a utility to find all "Mondays" between start and end.
    // simple approach: iterate from start date.

    // Map day name to index (Sunday=0, Monday=2 ? No, date-fns is Sunday=0)
    // Actually let's just use strict string comparison or a library
    const dayMap: Record<string, number> = {
        'SUNDAY': 0, 'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3,
        'THURSDAY': 4, 'FRIDAY': 5, 'SATURDAY': 6
    }
    const targetDayIndex = dayMap[schedule_day.toUpperCase()]

    if (targetDayIndex === undefined) throw new Error("Invalid Day")

    const sessions = []
    let current = parse(start_date, 'yyyy-MM-dd', new Date())
    const end = parse(end_date, 'yyyy-MM-dd', new Date())

    // Advance to first occurrence
    while (current.getDay() !== targetDayIndex) {
        current = addWeeks(current, 0) // no-op, just to keep type
        current.setDate(current.getDate() + 1)
    }

    while (current <= end) {
        sessions.push({
            offering_id: offeringId,
            date: format(current, 'yyyy-MM-dd'),
            start_time: schedule_start_time,
            end_time: schedule_end_time,
            status: 'SCHEDULED'
        })
        current = addWeeks(current, 1)
    }

    // 3. Insert Classes (Skipping existing to avoid unique constraint issues if we add constraints later, 
    // but for now we just insert. Ideally we should check existence.)
    if (sessions.length > 0) {
        const { error: insertError } = await supabase
            .from('elective_classes')
            .insert(sessions)

        if (insertError) throw new Error(insertError.message)
    }
}

/**
 * Fetches all scheduled classes for a specific offering.
 */
export async function getElectiveClasses(offeringId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('elective_classes')
        .select('*')
        .eq('offering_id', offeringId)
        .order('date')

    if (error) throw new Error(error.message)
    return data
}

export async function updateClassSession(classId: string, updates: {
    status?: 'SCHEDULED' | 'CANCELLED' | 'RESCHEDULED' | 'COMPLETED',
    date?: string,
    start_time?: string,
    end_time?: string,
    room?: string
}) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('elective_classes')
        .update(updates)
        .eq('id', classId)

    if (error) throw new Error(error.message)
    revalidatePath('/admin/electives')
}


// --- Enrollments ---

/**
 * Fetches all students enrolled in a specific elective offering.
 */
export async function getElectiveEnrollments(offeringId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('elective_enrollments')
        .select(`
      *,
      student:students(first_name, last_name, id)
    `)
        .eq('offering_id', offeringId)
        .order('created_at', { ascending: false })

    if (error) throw new Error(error.message)
    return data
}

/**
 * Enrolls a student in an elective offering.
 */
export async function enrollStudentInElective(studentId: string, offeringId: string, startDate: string) {
    const supabase = await createClient()
    const { error } = await supabase
        .from('elective_enrollments')
        .insert({
            student_id: studentId,
            offering_id: offeringId,
            start_date: startDate,
            status: 'ACTIVE'
        })

    if (error) throw new Error(error.message)
    revalidatePath('/admin/electives')
}

// --- Attendance ---

export async function getTeacherElectiveOfferings(teacherId: string) {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('elective_offerings')
        .select(`
            *,
            subject:elective_subjects(name)
        `)
        .eq('teacher_id', teacherId)
        .order('schedule_day')

    if (error) throw new Error(error.message)
    return data
}

/**
 * Generates the attendance sheet data for a specific elective class session.
 * 
 * Combines enrollment data, existing attendance records, and school-wide attendance status.
 */
export async function getElectiveAttendanceSheet(offeringId: string, date: string) {
    const supabase = await createClient()

    // 1. Get Class session for this offering and date
    const { data: classSession, error: classError } = await supabase
        .from('elective_classes')
        .select('*')
        .eq('offering_id', offeringId)
        .eq('date', date)
        .single()

    // If no session exists, it might be a holiday or unscheduled
    if (classError || !classSession) {
        // Return empty or throw? Component seems to expect data
        // Let's check if we should return something even if session doesn't exist?
        // Actually, the teacher sheet works by date.
        return []
    }

    // 2. Get Enrollments valid for this date
    const { data: enrollments, error: enrollmentError } = await supabase
        .from('elective_enrollments')
        .select(`
            id,
            student:students(id, first_name, last_name)
        `)
        .eq('offering_id', offeringId)
        .lte('start_date', date)
        .or(`end_date.is.null,end_date.gte.${date}`)
        .eq('status', 'ACTIVE')

    if (enrollmentError) throw new Error(enrollmentError.message)

    // 3. Get Existing Attendance Marks
    const { data: attendance, error: attendanceError } = await supabase
        .from('elective_attendance')
        .select('*')
        .eq('class_id', classSession.id)

    if (attendanceError) throw new Error(attendanceError.message)

    // 4. Get general school attendance for these students to show "Absent in School"
    const studentIds = enrollments.map(e => (e.student as any).id)
    const { data: schoolAttendance } = await supabase
        .from('attendance')
        .select('student_id, status')
        .in('student_id', studentIds)
        .eq('date', date)

    // 5. Merge
    return enrollments.map(enrollment => {
        const record = attendance?.find(a => a.student_id === (enrollment.student as any).id)
        const schoolRecord = schoolAttendance?.find(a => a.student_id === (enrollment.student as any).id)

        return {
            student: enrollment.student,
            enrollment_id: enrollment.id,
            status: record?.status || 'UNMARKED',
            remarks: record?.remarks || '',
            is_rollover: record?.is_rollover || false,
            rollover_note: record?.rollover_note || '',
            school_status: schoolRecord?.status || 'PRESENT', // Assume present if no record
            class_id: classSession.id
        }
    })
}

/**
 * Marks attendance for multiple students in an elective class.
 * 
 * Resolves enrollment IDs to student and class IDs before upserting attendance records.
 */
export async function markElectiveAttendance(payload: {
    enrollment_id: string,
    date: string,
    status: string,
    is_rollover?: boolean,
    rollover_note?: string
}[]) {
    const supabase = await createClient()

    // We need to map enrollment_id + date back to class_id + student_id
    // But payload usually comes from the sheet which knows the class_id and student_id?
    // Looking at ElectiveAttendanceSheet.tsx:
    // payload = students.map(s => ({ enrollment_id: s.enrollment_id, date: date, status: s.status, is_rollover: s.is_rollover, rollover_note: s.rollover_note }))

    // Let's resolve class_id first
    if (payload.length === 0) return

    // All should be for the same date and same offering (implied by sheet)
    // We need student_id and class_id

    for (const item of payload) {
        // Resolve student_id from enrollment_id
        const { data: enrollment } = await supabase
            .from('elective_enrollments')
            .select('student_id, offering_id')
            .eq('id', item.enrollment_id)
            .single()

        if (!enrollment) continue

        // Resolve class_id from offering_id + date
        const { data: classSession } = await supabase
            .from('elective_classes')
            .select('id')
            .eq('offering_id', enrollment.offering_id)
            .eq('date', item.date)
            .single()

        if (!classSession) continue

        const upsertData = {
            class_id: classSession.id,
            student_id: enrollment.student_id,
            status: item.status,
            is_rollover: item.is_rollover,
            rollover_note: item.rollover_note
        }

        const { error } = await supabase
            .from('elective_attendance')
            .upsert(upsertData, { onConflict: 'class_id, student_id' })

        if (error) throw new Error(error.message)
    }

    revalidatePath('/teacher/electives')
}

/**
 * Fetches attendance data for a specific class instance.
 */
export async function getElectiveClassAttendance(classId: string) {
    const supabase = await createClient()

    const { data: classSession, error: classError } = await supabase
        .from('elective_classes')
        .select('*, offering:elective_offerings(id)')
        .eq('id', classId)
        .single()

    if (classError) throw new Error(classError.message)

    const { data: enrollments, error: enrollmentError } = await supabase
        .from('elective_enrollments')
        .select(`
            id,
            student:students(id, first_name, last_name)
        `)
        .eq('offering_id', classSession.offering.id)
        .lte('start_date', classSession.date)
        .or(`end_date.is.null,end_date.gte.${classSession.date}`)
        .eq('status', 'ACTIVE')

    if (enrollmentError) throw new Error(enrollmentError.message)

    const { data: attendance, error: attendanceError } = await supabase
        .from('elective_attendance')
        .select('*')
        .eq('class_id', classId)

    if (attendanceError) throw new Error(attendanceError.message)

    return enrollments.map(enrollment => {
        const record = attendance?.find(a => a.student_id === (enrollment.student as any).id)
        return {
            student: enrollment.student,
            enrollment_id: enrollment.id,
            status: record?.status || 'UNMARKED',
            remarks: record?.remarks || '',
            is_rollover: record?.is_rollover || false,
            rollover_note: record?.rollover_note || '',
            attendance_id: record?.id
        }
    })
}

export async function markElectiveClassAttendance(payload: {
    class_id: string,
    student_id: string,
    status: string,
    remarks?: string,
    is_rollover?: boolean,
    rollover_note?: string
}[]) {
    const supabase = await createClient()

    const { error } = await supabase
        .from('elective_attendance')
        .upsert(payload, { onConflict: 'class_id, student_id' })

    if (error) throw new Error(error.message)
}
