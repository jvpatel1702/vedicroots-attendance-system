/**
 * useEnrollmentQueries.ts
 * -----------------------
 * Shared TanStack Query hooks for enrollment data.
 */
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabaseClient';

// ── Enrollments List ────────────────────────────────────────────────────────

/**
 * Fetches enrollments scoped to a specific academic year and organization.
 *
 * @param selectedYear - The academic_year_id UUID to filter by (required, never 'all').
 * @param orgId        - The organization UUID to scope results to.
 */
export function useEnrollments(selectedYear: string, orgId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['enrollments', selectedYear, orgId],
        // Only run when both a year and an org are selected
        enabled: !!selectedYear && !!orgId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('enrollments')
                .select(`
                    id,
                    status,
                    start_date,
                    end_date,
                    academic_year_id,
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
                        name,
                        location:locations!location_id (
                            id,
                            organization_id
                        )
                    ),
                    grade:grades!grade_id (
                        id,
                        name
                    )
                `)
                // Filter by selected academic year
                .eq('academic_year_id', selectedYear)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Scope to the selected organization by filtering on the nested location
            const scoped = (data as any[]).filter(
                (e: any) => e.classroom?.location?.organization_id === orgId
            );

            // Only return rows where the student join resolved (guards against orphaned rows)
            return scoped.filter((e: any) => e.student) ?? [];
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
