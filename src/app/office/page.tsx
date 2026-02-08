'use client';

import { useOrganization } from '@/context/OrganizationContext';
import { createClient } from '@/lib/supabaseClient';
import { useEffect, useState } from 'react';
import { Users, ClipboardCheck, GraduationCap, TrendingUp } from 'lucide-react';

export default function OfficeDashboard() {
    const { selectedOrganization } = useOrganization();
    const supabase = createClient();
    const [stats, setStats] = useState({
        totalStudents: 0,
        totalStaff: 0,
        totalClassrooms: 0,
        presentToday: 0
    });

    useEffect(() => {
        async function fetchStats() {
            if (!selectedOrganization) return;

            // Fetch student count
            const { count: studentCount } = await supabase
                .from('students')
                .select('*', { count: 'exact', head: true });

            // Fetch staff count
            const { count: staffCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .in('role', ['TEACHER', 'OFFICE']);

            // Fetch classroom count for this organization
            const { count: classroomCount } = await supabase
                .from('classrooms')
                .select('*, location:locations!inner(organization_id)', { count: 'exact', head: true })
                .eq('location.organization_id', selectedOrganization.id);

            // Fetch today's attendance
            const today = new Date().toISOString().split('T')[0];
            const { count: presentCount } = await supabase
                .from('attendance')
                .select('*', { count: 'exact', head: true })
                .eq('date', today)
                .eq('status', 'PRESENT');

            setStats({
                totalStudents: studentCount || 0,
                totalStaff: staffCount || 0,
                totalClassrooms: classroomCount || 0,
                presentToday: presentCount || 0
            });
        }

        fetchStats();
    }, [selectedOrganization, supabase]);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Office Dashboard</h1>
                <p className="text-gray-500 mt-2">
                    {selectedOrganization?.name || 'Select an organization'}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Total Students</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStudents}</p>
                        </div>
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Present Today</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.presentToday}</p>
                        </div>
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <ClipboardCheck className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Classrooms</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalClassrooms}</p>
                        </div>
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-purple-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Staff Members</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalStaff}</p>
                        </div>
                        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <TrendingUp className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <a
                        href="/admin/students"
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <h3 className="font-medium text-gray-900">Manage Students</h3>
                        <p className="text-sm text-gray-500 mt-1">View and edit student records</p>
                    </a>
                    <a
                        href="/admin/attendance"
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <h3 className="font-medium text-gray-900">Mark Attendance</h3>
                        <p className="text-sm text-gray-500 mt-1">Record student attendance</p>
                    </a>
                    <a
                        href="/admin/reports"
                        className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        <h3 className="font-medium text-gray-900">View Reports</h3>
                        <p className="text-sm text-gray-500 mt-1">Access attendance and student reports</p>
                    </a>
                </div>
            </div>
        </div>
    );
}
