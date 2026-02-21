/**
 * useOrganizationQueries.ts
 * -------------------------
 * Shared TanStack Query hooks for organization-scoped lookup data:
 * classrooms, grades, academic years.
 */
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabaseClient';

// ── Academic Years ──────────────────────────────────────────────────────────

export function useAcademicYears() {
    const supabase = createClient();
    return useQuery({
        queryKey: ['academic_years'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('academic_years')
                .select('id, name, is_active')
                .order('start_date', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
    });
}

// ── Classrooms for an Organization ─────────────────────────────────────────

export function useClassrooms(orgId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['classrooms', orgId],
        enabled: !!orgId,
        queryFn: async () => {
            const { data: locations } = await supabase
                .from('locations')
                .select('id')
                .eq('organization_id', orgId!);

            if (!locations || locations.length === 0) return [];

            const { data, error } = await supabase
                .from('classrooms')
                .select(`
                    *,
                    locations!inner(organization_id),
                    classroom_grades (
                        grades (name)
                    ),
                    teacher_classrooms (
                        staff (
                            persons (first_name, last_name)
                        )
                    ),
                    enrollments (count)
                `)
                .eq('locations.organization_id', orgId!)
                .order('name');
            if (error) throw error;
            return data ?? [];
        },
    });
}

// ── Simple classroom list (id + name only) for dropdowns ───────────────────

export function useClassroomOptions(orgId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['classroom_options', orgId],
        enabled: !!orgId,
        queryFn: async () => {
            const { data: locations } = await supabase
                .from('locations')
                .select('id')
                .eq('organization_id', orgId!);

            if (!locations || locations.length === 0) return [];

            const { data, error } = await supabase
                .from('classrooms')
                .select('id, name')
                .in('location_id', locations.map((l: any) => l.id))
                .order('name');
            if (error) throw error;
            return data ?? [];
        },
    });
}

// ── Grades for an Organization ──────────────────────────────────────────────

export function useGrades(orgId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['grades', orgId],
        enabled: !!orgId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('grades')
                .select('id, name')
                .eq('organization_id', orgId!)
                .order('order');
            if (error) throw error;
            return data ?? [];
        },
    });
}
