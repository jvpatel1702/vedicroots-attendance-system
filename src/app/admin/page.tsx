'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Users, UserCheck, UserX, Clock, CreditCard, Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function AdminDashboard() {
    const supabase = createClient();
    const [stats, setStats] = useState({
        totalStudents: 0,
        presentToday: 0,
        absentToday: 0,
        lateToday: 0
    });

    useEffect(() => {
        async function fetchStats() {
            const today = new Date().toISOString().split('T')[0];

            // 1. Total Active Students (via Enrollments)
            // If enrollments table is empty (seed might need check), fallback to students count for now
            const { count: enrollmentCount } = await supabase
                .from('enrollments')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'ACTIVE');

            // Fallback if enrollments is 0 (during transition)
            const { count: studentCount } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true });

            // 2. Attendance Stats
            const { data: attendance } = await supabase
                .from('attendance')
                .select('status')
                .eq('date', today);

            const present = attendance?.filter(a => a.status === 'PRESENT').length || 0;
            const absent = attendance?.filter(a => a.status === 'ABSENT').length || 0;
            const late = attendance?.filter(a => a.status === 'LATE').length || 0;

            setStats({
                totalStudents: (enrollmentCount || studentCount) || 0,
                presentToday: present,
                absentToday: absent,
                lateToday: late
            });
        }

        fetchStats();
    }, [supabase]);

    return (
        <div className="space-y-8 p-8 bg-gray-50/50 min-h-screen">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight text-brand-dark">Dashboard Overview</h2>
                    <p className="text-muted-foreground mt-2">Welcome to Vedic Roots Administration.</p>
                </div>
                <div className="flex gap-4">
                    <Select defaultValue="all">
                        <SelectTrigger className="w-[180px]">
                            <SelectValue placeholder="Select Location" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Locations</SelectItem>
                            <SelectItem value="main">Main Campus</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <DashboardCard
                    title="Total Students"
                    value={stats.totalStudents}
                    icon={<Users className="h-4 w-4 text-brand-sky" />}
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
                <DashboardCard
                    title="Late Arrivals"
                    value={stats.lateToday}
                    icon={<Clock className="h-4 w-4 text-brand-gold" />}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-muted-foreground text-sm text-center py-8">
                            No recent activity logs available.
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
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
