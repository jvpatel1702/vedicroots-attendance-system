/**
 * useDashboardQueries.ts
 * ----------------------
 * TanStack Query hook for the admin dashboard stats.
 * Fetches:
 *   1. Active enrollment count
 *   2. Today's student attendance breakdown (present / absent / late)
 *   3. Total staff + today's present staff
 *   4. Recent admissions (this month / next month)
 *   5. Today's holiday
 *   6. Location-wise strength (active students + present staff per location)
 *   7. Recent activity (new enrollments / departures in last 7 days)
 *   8. Upcoming holidays (next 30 days)
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
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];
            const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
            const thirtyDaysLater = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

            // ── 1. Active Enrollment Count ────────────────────────────────────
            const { count: enrollmentCount } = await supabase
                .from('enrollments')
                .select('id, classrooms!inner(locations!inner(organization_id))', { count: 'exact', head: true })
                .eq('status', 'ACTIVE')
                .eq('classrooms.locations.organization_id', orgId!);

            // ── 2. Today's Student Attendance ─────────────────────────────────
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

            // ── 3. Total Staff ────────────────────────────────────────────────
            const { count: staffCount } = await supabase
                .from('staff')
                .select('id, persons!inner(organization_id)', { count: 'exact', head: true })
                .eq('persons.organization_id', orgId!);

            // ── 4. Present Staff ──────────────────────────────────────────────
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

            // ── 5. Admissions (this month + next month) ───────────────────────
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

            // ── 6. Today's Holiday ────────────────────────────────────────────
            const { data: holidayData } = await supabase
                .from('school_holidays')
                .select('*')
                .lte('start_date', today)
                .gte('end_date', today)
                .eq('organization_id', orgId!)
                .limit(1);

            // ── 7. Location-wise Strength ─────────────────────────────────────
            // Fetches all locations for this org, then counts active students
            // per location via classrooms → enrollments.
            const { data: locationsData } = await supabase
                .from('locations')
                .select(`
                    id,
                    name,
                    classrooms (
                        id,
                        name,
                        enrollments (
                            id, status
                        )
                    )
                `)
                .eq('organization_id', orgId!);

            const locationStrength = (locationsData ?? []).map((loc: any) => {
                let activeStudents = 0;
                (loc.classrooms ?? []).forEach((cls: any) => {
                    activeStudents += (cls.enrollments ?? []).filter((e: any) => e.status === 'ACTIVE').length;
                });
                return {
                    id: loc.id,
                    name: loc.name,
                    activeStudents,
                    // Present staff per location is complex (staff aren't assigned to locations directly).
                    // We include total org-wide present staff as a proxy and will evolve this later.
                    presentStaffNote: 'org-wide',
                };
            });

            // ── 8. Recent Activity (last 7 days) ──────────────────────────────
            // New joins: enrollments created in the last 7 days
            const { data: recentJoins } = await supabase
                .from('enrollments')
                .select(`
                    id, start_date, created_at, status,
                    students (
                        person:persons (first_name, last_name)
                    ),
                    classrooms!inner(locations!inner(organization_id))
                `)
                .eq('classrooms.locations.organization_id', orgId!)
                .gte('created_at', sevenDaysAgo)
                .order('created_at', { ascending: false })
                .limit(10);

            // Recent departures: enrollments whose end_date is in the last 7 days
            const { data: recentDepartures } = await supabase
                .from('enrollments')
                .select(`
                    id, end_date,
                    students (
                        person:persons (first_name, last_name)
                    ),
                    classrooms!inner(locations!inner(organization_id))
                `)
                .eq('classrooms.locations.organization_id', orgId!)
                .gte('end_date', sevenDaysAgo)
                .lte('end_date', today)
                .order('end_date', { ascending: false })
                .limit(10);

            const recentActivity: any[] = [];

            (recentJoins ?? []).forEach((e: any) => {
                const student = e.students?.person;
                if (student) {
                    recentActivity.push({
                        id: `join-${e.id}`,
                        name: `${student.first_name} ${student.last_name}`,
                        type: 'JOIN',
                        date: e.start_date ?? e.created_at?.split('T')[0],
                    });
                }
            });

            (recentDepartures ?? []).forEach((e: any) => {
                const student = e.students?.person;
                if (student) {
                    recentActivity.push({
                        id: `leave-${e.id}`,
                        name: `${student.first_name} ${student.last_name}`,
                        type: 'LEAVE',
                        date: e.end_date,
                    });
                }
            });

            // Sort combined activity by date desc
            recentActivity.sort((a, b) => (a.date < b.date ? 1 : -1));

            // ── 9. Upcoming Holidays (next 30 days) ───────────────────────────
            const { data: upcomingHolidays } = await supabase
                .from('school_holidays')
                .select('id, name, start_date, end_date, description')
                .eq('organization_id', orgId!)
                .gte('start_date', today)
                .lte('start_date', thirtyDaysLater)
                .order('start_date', { ascending: true });

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
                locationStrength,
                recentActivity,
                upcomingHolidays: upcomingHolidays ?? [],
            };
        },
    });
}
