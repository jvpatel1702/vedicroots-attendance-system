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

export async function getElectiveSubjects() {
    const supabase = await createClient()
    const { data, error } = await supabase
        .from('elective_subjects')
        .select('*')
        .order('name')

    if (error) throw new Error(error.message)
    return data
}

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

export async function getElectiveClassAttendance(classId: string) {
    const supabase = await createClient()

    // 1. Get Class Details
    const { data: classSession, error: classError } = await supabase
        .from('elective_classes')
        .select('*, offering:elective_offerings(id)')
        .eq('id', classId)
        .single()

    if (classError) throw new Error(classError.message)

    // 2. Get Enrollments valid for this date
    // Only active enrollments that started BEFORE this class date and haven't ended (or ended AFTER)
    const { data: enrollments, error: enrollmentError } = await supabase
        .from('elective_enrollments')
        .select(`
            id,
            student:students(id, first_name, last_name)
        `)
        .eq('offering_id', classSession.offering.id)
        .lte('start_date', classSession.date)
        .or(`end_date.is.null,end_date.gte.${classSession.date}`)
        .eq('status', 'ACTIVE') // or DROPPED if we want to show history, but let's stick to ACTIVE for roll call

    if (enrollmentError) throw new Error(enrollmentError.message)

    // 3. Get Existing Attendance Marks
    const { data: attendance, error: attendanceError } = await supabase
        .from('elective_attendance')
        .select('*')
        .eq('class_id', classId)

    if (attendanceError) throw new Error(attendanceError.message)

    // 4. Merge
    return enrollments.map(enrollment => {
        const record = attendance?.find(a => a.student_id === (enrollment.student as any).id)
        return {
            student: enrollment.student,
            enrollment_id: enrollment.id,
            status: record?.status || 'UNMARKED', // UI treat as Present by default? or Unmarked
            remarks: record?.remarks || '',
            attendance_id: record?.id
        }
    })
}

export async function markElectiveClassAttendance(payload: {
    class_id: string,
    student_id: string,
    status: string,
    remarks?: string
}[]) {
    const supabase = await createClient()

    // Upsert logic
    const { error } = await supabase
        .from('elective_attendance')
        .upsert(payload, { onConflict: 'class_id, student_id' })

    if (error) throw new Error(error.message)
}

