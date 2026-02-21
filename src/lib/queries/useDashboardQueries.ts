/**
 * useDashboardQueries.ts
 * ----------------------
 * Shared TanStack Query hook for the admin dashboard stats.
 * Combines: total students, total staff, today's attendance, admissions, holiday.
 */
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabaseClient';

export function useDashboardStats(orgId: string | undefined) {
    const supabase = createClient();
    return useQuery({
        queryKey: ['dashboard_stats', orgId],
        enabled: !!orgId,
        // Refresh every 5 minutes since it shows today's live data
        staleTime: 1000 * 60 * 5,
        queryFn: async () => {
            const today = new Date().toISOString().split('T')[0];
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

            // 1. Total Active Students
            const { count: enrollmentCount } = await supabase
                .from('enrollments')
                .select('id, classrooms!inner(locations!inner(organization_id))', { count: 'exact', head: true })
                .eq('status', 'ACTIVE')
                .eq('classrooms.locations.organization_id', orgId!);

            // 2. Today's Student Attendance
            const { data: attendance } = await supabase
                .from('attendance')
                .select(`
                    status,
                    arrival_time,
                    students!inner(
                        first_name,
                        last_name,
                        enrollments!inner(
                            classrooms!inner(
                                locations!inner(organization_id)
                            )
                        )
                    )
                `)
                .eq('date', today)
                .eq('students.enrollments.status', 'ACTIVE')
                .eq('students.enrollments.classrooms.locations.organization_id', orgId!);

            const present = attendance?.filter((a: any) => a.status === 'PRESENT').length || 0;
            const absent = attendance?.filter((a: any) => a.status === 'ABSENT').length || 0;
            const late = attendance?.filter((a: any) => a.status === 'LATE').length || 0;
            const absentStudents = attendance?.filter((a: any) => a.status === 'ABSENT').map((a: any) => ({
                id: Math.random().toString(),
                name: a.students ? `${a.students.first_name} ${a.students.last_name}` : 'Unknown',
            })) || [];

            // 3. Total Staff
            const { count: staffCount } = await supabase
                .from('staff')
                .select('id, persons!inner(organization_id)', { count: 'exact', head: true })
                .eq('persons.organization_id', orgId!);

            // 4. Present Staff
            const { data: staffAttendance } = await supabase
                .from('staff_attendance')
                .select(`
                    status,
                    check_in,
                    staff!inner(
                        role,
                        persons!inner(first_name, last_name, organization_id)
                    )
                `)
                .eq('date', today)
                .eq('status', 'PRESENT')
                .eq('staff.persons.organization_id', orgId!);

            const uniqueEmployees = new Map<string, any>();
            staffAttendance?.forEach((sa: any) => {
                const name = sa.staff?.persons
                    ? `${sa.staff.persons.first_name} ${sa.staff.persons.last_name}`
                    : 'Unknown';
                if (!uniqueEmployees.has(name)) {
                    uniqueEmployees.set(name, {
                        id: Math.random().toString(),
                        name,
                        role: sa.staff?.role || 'Staff',
                        checkInTime: sa.check_in,
                    });
                }
            });

            // 5. Admissions (this month + next month)
            const { data: enrollmentData } = await supabase
                .from('enrollments')
                .select(`
                    start_date, end_date,
                    students(first_name, last_name),
                    classrooms!inner(locations!inner(organization_id))
                `)
                .eq('classrooms.locations.organization_id', orgId!)
                .or(`start_date.gte.${startOfMonth},end_date.gte.${startOfMonth}`);

            const admissionList: any[] = [];
            const now = new Date();
            const currentMonth = now.getMonth();
            const nextMonth = (currentMonth + 1) % 12;
            enrollmentData?.forEach((e: any) => {
                const sDate = new Date(e.start_date + 'T00:00:00');
                const endDate = e.end_date ? new Date(e.end_date + 'T00:00:00') : null;
                if (sDate.getMonth() === currentMonth && sDate.getFullYear() === now.getFullYear()) {
                    admissionList.push({ id: Math.random().toString(), name: `${e.students.first_name} ${e.students.last_name}`, date: e.start_date, type: 'JOINING' });
                } else if (sDate.getMonth() === nextMonth) {
                    admissionList.push({ id: Math.random().toString(), name: `${e.students.first_name} ${e.students.last_name}`, date: e.start_date, type: 'UPCOMING' });
                }
                if (endDate && endDate.getMonth() === currentMonth && endDate.getFullYear() === now.getFullYear()) {
                    admissionList.push({ id: Math.random().toString(), name: `${e.students.first_name} ${e.students.last_name}`, date: e.end_date, type: 'FINISHING' });
                }
            });

            // 6. Today's Holiday
            const { data: holidayData } = await supabase
                .from('school_holidays')
                .select('*')
                .lte('start_date', today)
                .gte('end_date', today)
                .eq('organization_id', orgId!)
                .limit(1);

            return {
                totalStudents: enrollmentCount || 0,
                totalStaff: staffCount || 0,
                presentToday: present,
                absentToday: absent,
                lateToday: late,
                absentStudents,
                presentEmployees: Array.from(uniqueEmployees.values()),
                admissions: admissionList,
                todayHoliday: holidayData && holidayData.length > 0 ? holidayData[0] : null,
            };
        },
    });
}
