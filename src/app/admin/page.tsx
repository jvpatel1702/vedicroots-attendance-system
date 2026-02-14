'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Users, UserCheck, UserX, Clock, CreditCard, Building2, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { AbsentStudentsCard, PresentEmployeesCard, NewAdmissionsCard } from '@/components/admin/DashboardWidgets';
import { useOrganization } from '@/context/OrganizationContext';

export default function AdminDashboard() {
    const supabase = createClient();
    const { selectedOrganization, isLoading: isOrgLoading } = useOrganization();

    const [stats, setStats] = useState({
        totalStudents: 0,
        totalStaff: 0,
        presentToday: 0,
        absentToday: 0,
        lateToday: 0
    });

    const [todayHoliday, setTodayHoliday] = useState<any>(null);

    // Widget Data States
    const [absentStudents, setAbsentStudents] = useState<any[]>([]);
    const [presentEmployees, setPresentEmployees] = useState<any[]>([]);
    const [admissions, setAdmissions] = useState<any[]>([]);

    useEffect(() => {
        async function fetchStats() {
            if (!selectedOrganization) return;

            const orgId = selectedOrganization.id;
            const today = new Date().toISOString().split('T')[0];
            const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

            // 1. Total Active Students in Organization
            // Filter: Enrollments -> Classrooms -> Locations -> Org
            const { count: enrollmentCount, error: enrollError } = await supabase
                .from('enrollments')
                .select('id, classrooms!inner(locations!inner(organization_id))', { count: 'exact', head: true })
                .eq('status', 'ACTIVE')
                .eq('classrooms.locations.organization_id', orgId);

            if (enrollError) console.error("Error fetching students:", enrollError);

            // 2. Attendance Stats
            // Fetch all attendance for today, then filter by Org via Student Enrollments
            // Note: Deep filtering in one go is better if possible.
            // We need students who belong to this Org.
            const { data: attendance, error: attError } = await supabase
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
                .eq('students.enrollments.status', 'ACTIVE') // Only active enrollments
                .eq('students.enrollments.classrooms.locations.organization_id', orgId);

            if (attError) console.error("Error fetching attendance:", attError);

            const present = attendance?.filter((a: any) => a.status === 'PRESENT').length || 0;
            const absent = attendance?.filter((a: any) => a.status === 'ABSENT').length || 0;
            const late = attendance?.filter((a: any) => a.status === 'LATE').length || 0;

            const absentOnly = attendance?.filter((a: any) => a.status === 'ABSENT').map((a: any) => ({
                id: Math.random().toString(),
                name: a.students ? `${a.students.first_name} ${a.students.last_name}` : 'Unknown'
            })) || [];

            setAbsentStudents(absentOnly);

            // 3. Staff Stats & Attendance
            // Staff linked via persons -> organization_id
            const { count: staffCount, error: staffError } = await supabase
                .from('staff')
                .select('id, persons!inner(organization_id)', { count: 'exact', head: true })
                .eq('persons.organization_id', orgId);

            if (staffError) console.error("Error fetching staff:", staffError);

            // Present Employees
            const { data: staffAttendance, error: staffAttError } = await supabase
                .from('staff_attendance')
                .select(`
                    status, 
                    check_in, 
                    staff!inner(
                        role,
                        persons!inner(
                            first_name, 
                            last_name,
                            organization_id
                        )
                    )
                `)
                .eq('date', today)
                .eq('status', 'PRESENT')
                .eq('staff.persons.organization_id', orgId);

            if (staffAttError) console.error("Error fetching staff attendance:", staffAttError);

            if (staffAttendance) {
                // Filter duplicates if a teacher has multiple classrooms in same org
                const uniqueEmployees = new Map();
                staffAttendance.forEach((sa: any) => {
                    const name = sa.staff?.persons ? `${sa.staff.persons.first_name} ${sa.staff.persons.last_name}` : 'Unknown';
                    if (!uniqueEmployees.has(name)) {
                        uniqueEmployees.set(name, {
                            id: Math.random().toString(),
                            name: name,
                            role: sa.staff?.role || 'Staff',
                            checkInTime: sa.check_in
                        });
                    }
                });
                setPresentEmployees(Array.from(uniqueEmployees.values()));
            }

            // 4. Enrollments (Admissions)
            const { data: enrollmentData, error: admError } = await supabase
                .from('enrollments')
                .select(`
                    start_date, 
                    end_date, 
                    students(first_name, last_name),
                    classrooms!inner(
                        locations!inner(organization_id)
                    )
                `)
                .eq('classrooms.locations.organization_id', orgId)
                .or(`start_date.gte.${startOfMonth},end_date.gte.${startOfMonth}`);

            if (admError) console.error("Error fetching admissions:", admError);

            const admissionList: any[] = [];
            if (enrollmentData) {
                enrollmentData.forEach((e: any) => {
                    const sDate = new Date(e.start_date + 'T00:00:00');
                    const endDate = e.end_date ? new Date(e.end_date + 'T00:00:00') : null;
                    const now = new Date();
                    const currentMonth = now.getMonth();
                    const nextMonth = (currentMonth + 1) % 12;

                    // Joining This Month
                    if (sDate.getMonth() === currentMonth && sDate.getFullYear() === now.getFullYear()) {
                        admissionList.push({
                            id: Math.random().toString(),
                            name: `${e.students.first_name} ${e.students.last_name}`,
                            date: e.start_date,
                            type: 'JOINING'
                        });
                    }
                    // Joining Next Month
                    else if (sDate.getMonth() === nextMonth) {
                        admissionList.push({
                            id: Math.random().toString(),
                            name: `${e.students.first_name} ${e.students.last_name}`,
                            date: e.start_date,
                            type: 'UPCOMING'
                        });
                    }

                    // Finishing This Month
                    if (endDate && endDate.getMonth() === currentMonth && endDate.getFullYear() === now.getFullYear()) {
                        admissionList.push({
                            id: Math.random().toString(),
                            name: `${e.students.first_name} ${e.students.last_name}`,
                            date: e.end_date,
                            type: 'FINISHING'
                        });
                    }
                });
            }
            setAdmissions(admissionList);

            setStats({
                totalStudents: enrollmentCount || 0,
                totalStaff: staffCount || 0,
                presentToday: present,
                absentToday: absent,
                lateToday: late
            });

            // Fetch Holiday
            const { data: holidayData } = await supabase
                .from('school_holidays')
                .select('*')
                .lte('start_date', today)
                .gte('end_date', today)
                .eq('organization_id', orgId)
                .limit(1);

            if (holidayData && holidayData.length > 0) {
                setTodayHoliday(holidayData[0]);
            } else {
                setTodayHoliday(null);
            }
        }

        fetchStats();
    }, [supabase, selectedOrganization]);



    if (isOrgLoading) {
        return <div className="p-8">Loading Organization Context...</div>;
    }

    return (
        <div className="space-y-8 p-8 bg-gray-50/50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-brand-dark">Dashboard Overview</h2>
                    <p className="text-muted-foreground mt-2">
                        Welcome to {selectedOrganization?.name || 'Vedic Roots Administration'}.
                    </p>
                </div>
            </div>

            {todayHoliday && (
                <div className="bg-brand-cream border border-brand-gold/30 p-4 rounded-xl flex items-center gap-4 text-brand-olive shadow-sm">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-bold">Today is a School Holiday: {todayHoliday.name}</p>
                        <p className="text-sm opacity-80">Regular and elective attendance marking is disabled for today.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard
                    title="Total Students"
                    value={stats.totalStudents}
                    icon={<Users className="h-4 w-4 text-brand-sky" />}
                />
                <DashboardCard
                    title="Total Staff"
                    value={stats.totalStaff}
                    icon={<UserCheck className="h-4 w-4 text-brand-olive" />}
                />
                <DashboardCard
                    title="Present Today"
                    value={stats.presentToday}
                    icon={<UserCheck className="h-4 w-4 text-brand-olive" />}
                />
                <DashboardCard
                    title="Absent Today"
                    value={stats.absentToday}
                    icon={<UserX className="h-4 w-4 text-destructive" />}
                />
            </div>

            {/* New Widgets Section - Side by Side */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AbsentStudentsCard students={absentStudents} />
                <PresentEmployeesCard employees={presentEmployees} />
                <NewAdmissionsCard admissions={admissions} />
            </div>

            {/* Enrollment Chart - Full Width */}
            <div className="w-full">
                <Card>
                    <CardHeader>
                        <CardTitle>Enrollment by Program</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[200px] flex items-center justify-center text-muted-foreground text-sm">
                            Chart Placeholder (Recharts Integration Pending)
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div >
    );
}

function DashboardCard({ title, value, icon }: { title: string, value: number, icon: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                    {title}
                </CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">
                    +0% from last month
                </p>
            </CardContent>
        </Card>
    );
}
