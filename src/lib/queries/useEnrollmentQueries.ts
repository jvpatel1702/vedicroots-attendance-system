/**
 * useEnrollmentQueries.ts
 * -----------------------
 * Shared TanStack Query hooks for enrollment data.
 */
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabaseClient';

// ── Enrollments List ────────────────────────────────────────────────────────

export function useEnrollments(selectedYear: string) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['enrollments', selectedYear],
        enabled: !!selectedYear,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('enrollments')
                .select(`
                    id,
                    status,
                    start_date,
                    end_date,
                    student:students!student_id (
                        id,
                        student_number,
                        person:persons!person_id (
                            first_name,
                            last_name
                        )
                    ),
                    classroom:classrooms!classroom_id (
                        id,
                        name
                    ),
                    grade:grades!grade_id (
                        id,
                        name
                    )
                `)
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data as any[]).filter((e: any) => e.student) ?? [];
        },
    });
}

// ── Single Enrollment Detail ────────────────────────────────────────────────

export function useEnrollment(enrollmentId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['enrollment', enrollmentId],
        enabled: !!enrollmentId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('enrollments')
                .select(`
                    *,
                    students (
                        id, student_number,
                        persons (first_name, last_name)
                    ),
                    classrooms (id, name),
                    grades (id, name),
                    academic_years (id, name)
                `)
                .eq('id', enrollmentId!)
                .single();
            if (error) throw error;
            return data;
        },
    });
}
