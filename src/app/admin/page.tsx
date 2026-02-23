'use client';

/**
 * Admin Dashboard Overview Page
 * ------------------------------
 * Uses TanStack Query (useDashboardStats) for automatic caching and background refresh.
 */

import { useOrganization } from '@/context/OrganizationContext';
import { Users, UserCheck, UserX, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AbsentStudentsCard, PresentEmployeesCard, NewAdmissionsCard } from '@/components/admin/DashboardWidgets';
import { useDashboardStats } from '@/lib/queries';

export default function AdminDashboard() {
    const { selectedOrganization, isLoading: isOrgLoading } = useOrganization();
    const { data, isLoading } = useDashboardStats(selectedOrganization?.id);

    if (isOrgLoading) {
        return <div className="p-8">Loading Organization Stats...</div>;
    }

    const stats = {
        totalStudents: data?.totalStudents ?? 0,
        totalStaff: data?.totalStaff ?? 0,
        presentToday: data?.presentToday ?? 0,
        absentToday: data?.absentToday ?? 0,
    };

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

            {data?.todayHoliday && (
                <div className="bg-brand-cream border border-brand-gold/30 p-4 rounded-xl flex items-center gap-4 text-brand-olive shadow-sm">
                    <div className="p-2 bg-white rounded-lg shadow-sm">
                        <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                        <p className="font-bold">Today is a School Holiday: {data.todayHoliday.name}</p>
                        <p className="text-sm opacity-80">Regular and elective attendance marking is disabled for today.</p>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard title="Total Students" value={isLoading ? '...' : stats.totalStudents} icon={<Users className="h-4 w-4 text-brand-sky" />} />
                <DashboardCard title="Total Staff" value={isLoading ? '...' : stats.totalStaff} icon={<UserCheck className="h-4 w-4 text-brand-olive" />} />
                <DashboardCard title="Present Today" value={isLoading ? '...' : stats.presentToday} icon={<UserCheck className="h-4 w-4 text-brand-olive" />} />
                <DashboardCard title="Absent Today" value={isLoading ? '...' : stats.absentToday} icon={<UserX className="h-4 w-4 text-destructive" />} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <AbsentStudentsCard students={data?.absentStudents ?? []} />
                <PresentEmployeesCard employees={data?.presentEmployees ?? []} />
                <NewAdmissionsCard admissions={data?.admissions ?? []} />
            </div>

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
        </div>
    );
}

function DashboardCard({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                <p className="text-xs text-muted-foreground">+0% from last month</p>
            </CardContent>
        </Card>
    );
}
