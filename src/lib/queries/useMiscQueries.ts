/**
 * useMiscQueries.ts
 * -----------------
 * Shared TanStack Query hooks for miscellaneous data:
 * holidays, users, pay periods, vacations, attendance.
 */
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabaseClient';

// ── School Holidays ─────────────────────────────────────────────────────────

export function useHolidays(orgId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['holidays', orgId],
        enabled: !!orgId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('school_holidays')
                .select('*')
                .eq('organization_id', orgId!)
                .order('start_date', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
    });
}

// ── Users ───────────────────────────────────────────────────────────────────

export function useUsers(orgId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['users', orgId],
        enabled: !!orgId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('staff')
                .select(`
                    id, role, email, user_id,
                    persons!inner(first_name, last_name, organization_id)
                `)
                .eq('persons.organization_id', orgId!)
                .not('user_id', 'is', null);
            if (error) throw error;
            return data ?? [];
        },
    });
}

// ── Pay Periods ─────────────────────────────────────────────────────────────

export function usePayPeriods(orgId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['pay_periods', orgId],
        enabled: !!orgId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('pay_periods')
                .select('*')
                .eq('organization_id', orgId!)
                .order('start_date', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
    });
}

// ── Student Vacations (org-wide, for admin view) ────────────────────────────

export function useVacations(orgId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['vacations', orgId],
        enabled: !!orgId,
        queryFn: async () => {
            const { data, error } = await supabase
                .from('student_vacations')
                .select(`
                    *,
                    students (
                        id,
                        persons (first_name, last_name)
                    )
                `)
                .order('start_date', { ascending: false });
            if (error) throw error;
            return data ?? [];
        },
    });
}

// ── Staff Attendance (date range) ───────────────────────────────────────────

export function useStaffAttendance(orgId: string | undefined, startDate?: string, endDate?: string) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['staff_attendance', orgId, startDate, endDate],
        enabled: !!orgId,
        queryFn: async () => {
            let query = supabase
                .from('staff_attendance')
                .select(`
                    id, date, status, check_in, check_out, notes,
                    staff!inner(
                        id, role,
                        persons!inner(first_name, last_name, organization_id)
                    )
                `)
                .eq('staff.persons.organization_id', orgId!)
                .order('date', { ascending: false });

            if (startDate) query = query.gte('date', startDate);
            if (endDate) query = query.lte('date', endDate);

            const { data, error } = await query;
            if (error) throw error;
            return data ?? [];
        },
    });
}

// ── Teacher Dashboard Data ──────────────────────────────────────────────────

export function useTeacherDashboard(userId: string | undefined) {
    const supabase = createClient();
    const today = new Date().toISOString().split('T')[0];
    return useQuery({
        queryKey: ['teacher_dashboard', userId, today],
        enabled: !!userId,
        staleTime: 1000 * 60 * 2, // 2 min — live attendance data
        queryFn: async () => {
            // 1. Get staff ID
            const { data: staffData } = await supabase
                .from('staff')
                .select('id')
                .eq('user_id', userId!)
                .single();

            if (!staffData) return { staffId: null, classes: [], stats: { totalStudents: 0, presentToday: 0, absentToday: 0, electiveClasses: 0 } };

            // 2. Get classrooms
            const { data: classData } = await supabase
                .from('teacher_classrooms')
                .select(`classrooms (id, name, enrollments(count))`)
                .eq('staff_id', staffData.id);

            const classroomIds = classData?.map((item: any) => item.classrooms?.id).filter(Boolean) || [];

            // 3. Check attendance
            const { data: attendanceData } = await supabase
                .from('attendance')
                .select('student_id, status, students!inner(enrollments!inner(classroom_id))')
                .eq('date', today)
                .in('students.enrollments.classroom_id', classroomIds.length > 0 ? classroomIds : ['none']);

            const markedClassrooms = new Set(
                attendanceData?.map((a: any) => a.students?.enrollments?.[0]?.classroom_id).filter(Boolean) || []
            );

            const classes = classData?.map((item: any) => {
                const cls = item.classrooms;
                return {
                    id: cls.id,
                    name: cls.name,
                    studentCount: cls.enrollments?.[0]?.count || 0,
                    attendanceMarked: markedClassrooms.has(cls.id),
                };
            }) || [];

            // 4. Elective count
            const { count: electiveCount } = await supabase
                .from('elective_offerings')
                .select('id', { count: 'exact' })
                .eq('teacher_id', userId!);

            const totalStudents = classes.reduce((sum: number, c: any) => sum + c.studentCount, 0);
            const presentCount = attendanceData?.filter((a: any) => a.status === 'PRESENT').length || 0;
            const absentCount = attendanceData?.filter((a: any) => a.status === 'ABSENT').length || 0;

            return {
                staffId: staffData.id,
                classes,
                stats: {
                    totalStudents,
                    presentToday: presentCount,
                    absentToday: absentCount,
                    electiveClasses: electiveCount || 0,
                },
            };
        },
    });
}
