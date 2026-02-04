'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Users, UserCheck, UserX, Clock } from 'lucide-react';

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

            // 1. Total Students
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
                totalStudents: studentCount || 0,
                presentToday: present,
                absentToday: absent,
                lateToday: late
            });
        }

        fetchStats();
    }, []);

    return (
        <div className="space-y-8">
            <div>
                <h2 className="text-3xl font-bold text-gray-900">Dashboard Overview</h2>
                <p className="text-gray-500 mt-2">Welcome to the administration panel.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Students" value={stats.totalStudents} icon={<Users className="text-blue-600" />} color="bg-blue-50" />
                <StatCard title="Present Today" value={stats.presentToday} icon={<UserCheck className="text-green-600" />} color="bg-green-50" />
                <StatCard title="Absent Today" value={stats.absentToday} icon={<UserX className="text-red-600" />} color="bg-red-50" />
                <StatCard title="Late Arrivals" value={stats.lateToday} icon={<Clock className="text-yellow-600" />} color="bg-yellow-50" />
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Recent Activity</h3>
                <div className="text-gray-500 text-sm text-center py-8">
                    No recent activity logs available (Audit Log implementation pending).
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string, value: number, icon: React.ReactNode, color: string }) {
    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 flex items-center gap-4">
            <div className={`p-3 rounded-lg ${color}`}>
                {icon}
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
            </div>
        </div>
    );
}
