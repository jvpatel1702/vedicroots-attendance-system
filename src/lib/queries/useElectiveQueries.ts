/**
 * useElectiveQueries.ts
 * ---------------------
 * Shared TanStack Query hooks for electives.
 */
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabaseClient';

// ── Elective Offerings (all available) ─────────────────────────────────────

export function useElectiveOfferings() {
    const supabase = createClient();
    return useQuery({
        queryKey: ['elective_offerings'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('elective_offerings')
                .select(`
                    id, schedule_day, schedule_start_time,
                    subject:elective_subjects (id, name)
                `)
                .order('schedule_day');
            if (error) throw error;
            return data ?? [];
        },
    });
}

// ── Elective Subjects ───────────────────────────────────────────────────────

export function useElectiveSubjects(orgId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['elective_subjects', orgId],
        enabled: !!orgId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('elective_subjects')
                .select('id, name, description')
                .eq('organization_id', orgId!)
                .order('name');
            if (error) throw error;
            return data ?? [];
        },
    });
}
