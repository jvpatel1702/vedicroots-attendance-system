/**
 * useStudentQueries.ts
 * --------------------
 * Shared TanStack Query hooks for student data.
 */
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabaseClient';

// ── Students List ───────────────────────────────────────────────────────────

export function useStudents(orgId: string | undefined, selectedYear: string) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['students', orgId, selectedYear],
        enabled: !!orgId && !!selectedYear,
        queryFn: async () => {
            // 1. Get classrooms for this org
            const { data: locations } = await supabase
                .from('locations')
                .select('id')
                .eq('organization_id', orgId!);

            if (!locations || locations.length === 0) return [];

            const { data: orgClassrooms } = await supabase
                .from('classrooms')
                .select('id')
                .in('location_id', locations.map((l: any) => l.id));

            const classroomIds = orgClassrooms?.map((c: any) => c.id) || [];
            if (classroomIds.length === 0) return [];

            let query = supabase
                .from('students')
                .select(`
                    id,
                    student_number,
                    gender,
                    dob,
                    person:persons!inner (
                        first_name,
                        last_name,
                        dob,
                        photo_url
                    ),
                    medical:student_medical (
                        allergies,
                        medical_conditions,
                        medications,
                        doctor_name,
                        doctor_phone
                    ),
                    student_guardians (
                        is_primary,
                        guardians (
                            email,
                            phone
                        )
                    ),
                    enrollments!inner (
                        status,
                        classroom_id,
                        grade_id,
                        academic_year_id,
                        classrooms (id, name),
                        grades (id, name, order)
                    )
                `)
                .eq('enrollments.academic_year_id', selectedYear)
                .in('enrollments.classroom_id', classroomIds);

            const { data, error } = await query;
            if (error) throw error;

            return (data as any[]).filter((s: any) => s.person) ?? [];
        },
    });
}

// ── Single Student Detail ───────────────────────────────────────────────────

export function useStudent(studentId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['student', studentId],
        enabled: !!studentId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('students')
                .select(`
                    id,
                    student_number,
                    person:persons (id, first_name, last_name, dob, photo_url),
                    medical:student_medical (allergies, medical_conditions, medications, doctor_name, doctor_phone)
                `)
                .eq('id', studentId!)
                .single();
            if (error) throw error;
            return data;
        },
    });
}

// ── Student Guardians ───────────────────────────────────────────────────────

export function useStudentGuardians(studentId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['student_guardians', studentId],
        enabled: !!studentId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('student_guardians')
                .select(`
                    guardian_id,
                    relationship,
                    is_primary,
                    is_pickup_authorized,
                    is_emergency_contact,
                    guardians (id, first_name, last_name, email, phone)
                `)
                .eq('student_id', studentId!);
            if (error) throw error;
            return (data ?? []).map((g: any) => ({
                id: g.guardians.id,
                first_name: g.guardians.first_name,
                last_name: g.guardians.last_name,
                email: g.guardians.email,
                phone: g.guardians.phone,
                relationship: g.relationship,
                is_primary: g.is_primary,
                is_pickup_authorized: g.is_pickup_authorized,
                is_emergency_contact: g.is_emergency_contact,
            }));
        },
    });
}

// ── Student Vacations ───────────────────────────────────────────────────────

export function useStudentVacations(studentId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['student_vacations', studentId],
        enabled: !!studentId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('student_vacations')
                .select('*')
                .eq('student_id', studentId!)
                .order('start_date', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
    });
}

// ── Student Enrollments ─────────────────────────────────────────────────────

export function useStudentEnrollments(studentId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['student_enrollments', studentId],
        enabled: !!studentId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('enrollments')
                .select(`
                    id, status, classroom_id, grade_id, academic_year_id, start_date, end_date,
                    classrooms (id, name),
                    grades (id, name),
                    academic_years (id, name)
                `)
                .eq('student_id', studentId!)
                .order('status');
            if (error) throw error;
            return data ?? [];
        },
    });
}

// ── Student Extended Care Subscriptions ────────────────────────────────────

export function useStudentExtendedCare(studentId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['student_extended_care', studentId],
        enabled: !!studentId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('extended_care_subscriptions')
                .select('*')
                .eq('student_id', studentId!)
                .order('start_date', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
    });
}

// ── Student Elective Enrollments ────────────────────────────────────────────

export function useStudentElectives(studentId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['student_electives', studentId],
        enabled: !!studentId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('elective_enrollments')
                .select(`
                    id, status, start_date, end_date,
                    offering:elective_offerings (
                        id, schedule_day, schedule_start_time,
                        subject:elective_subjects (id, name)
                    )
                `)
                .eq('student_id', studentId!);
            if (error) throw error;
            return data ?? [];
        },
    });
}
