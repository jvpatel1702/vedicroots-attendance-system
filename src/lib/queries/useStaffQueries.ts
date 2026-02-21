/**
 * useStaffQueries.ts
 * ------------------
 * Shared TanStack Query hooks for staff data.
 */
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabaseClient';

// ── Staff List ──────────────────────────────────────────────────────────────

export function useStaff(orgId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['staff', orgId],
        enabled: !!orgId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('staff')
                .select(`
                    id,
                    email,
                    role,
                    user_id,
                    persons!inner(first_name, last_name, organization_id),
                    teacher_classrooms (
                        classrooms (name)
                    )
                `)
                .eq('persons.organization_id', orgId!)
                .order('role');
            if (error) throw error;
            return (data as any[])
                .filter((s: any) => s.persons)
                .map((s: any) => ({
                    id: s.id,
                    name: `${s.persons.first_name} ${s.persons.last_name}`,
                    email: s.email || '',
                    role: s.role,
                    user_id: s.user_id,
                    teacher_classrooms: s.teacher_classrooms,
                }));
        },
    });
}

// ── Single Staff Member ─────────────────────────────────────────────────────

export function useStaffMember(staffId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['staff_member', staffId],
        enabled: !!staffId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('staff')
                .select(`
                    id, email, role, user_id,
                    persons (id, first_name, last_name, organization_id),
                    teacher_classrooms (
                        classrooms (id, name)
                    )
                `)
                .eq('id', staffId!)
                .single();
            if (error) throw error;
            return data;
        },
    });
}

// ── Staff ID by User ID ─────────────────────────────────────────────────────

export function useStaffByUserId(userId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['staff_by_user', userId],
        enabled: !!userId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('staff')
                .select('id')
                .eq('user_id', userId!)
                .single();
            if (error) throw error;
            return data;
        },
    });
}
