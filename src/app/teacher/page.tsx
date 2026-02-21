'use client';

/**
 * Teacher Dashboard Page
 * ----------------------
 * Uses TanStack Query (useTeacherDashboard) for automatic caching.
 */

import Link from 'next/link';
import { ChevronRight, ClipboardCheck, Users, Calendar, BookOpen, AlertCircle } from 'lucide-react';
import { useUser } from '@/lib/useUser';
import ClockInWidget from '@/components/staff/ClockInWidget';
import { useTeacherDashboard } from '@/lib/queries';

export default function TeacherDashboard() {
    const { user, loading } = useUser();
    const { data, isLoading: dataLoading } = useTeacherDashboard(user?.id);

    if (loading || dataLoading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    const classes = data?.classes ?? [];
    const stats = data?.stats ?? { totalStudents: 0, presentToday: 0, absentToday: 0, electiveClasses: 0 };
    const staffId = data?.staffId ?? null;
    const unmarkedClasses = classes.filter((c: any) => !c.attendanceMarked);

    return (
        <div className="space-y-6">
            {/* Clock In Widget */}
            {staffId && (
                <div className="mb-6">
                    <ClockInWidget staffId={staffId} />
                </div>
            )}

            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <h2 className="text-2xl font-bold">Welcome back!</h2>
                <p className="opacity-90 mt-1">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
            </div>

            {/* Pending Attendance Alert */}
            {unmarkedClasses.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                    <AlertCircle className="text-amber-600 flex-shrink-0" size={24} />
                    <div className="flex-1">
                        <p className="font-medium text-amber-800">Attendance Pending</p>
                        <p className="text-sm text-amber-700">
                            {unmarkedClasses.length} class{unmarkedClasses.length > 1 ? 'es' : ''} need attendance: {unmarkedClasses.map((c: any) => c.name).join(', ')}
                        </p>
                    </div>
                    <Link href="/teacher/attendance" className="text-amber-700 hover:text-amber-900 font-medium text-sm whitespace-nowrap">
                        Mark Now →
                    </Link>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                    <Users className="mx-auto text-indigo-500 mb-2" size={24} />
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                    <p className="text-xs text-gray-500">My Students</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                    <ClipboardCheck className="mx-auto text-green-500 mb-2" size={24} />
                    <p className="text-2xl font-bold text-gray-900">{stats.presentToday}</p>
                    <p className="text-xs text-gray-500">Present Today</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                    <Calendar className="mx-auto text-red-500 mb-2" size={24} />
                    <p className="text-2xl font-bold text-gray-900">{stats.absentToday}</p>
                    <p className="text-xs text-gray-500">Absent Today</p>
                </div>
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                    <BookOpen className="mx-auto text-purple-500 mb-2" size={24} />
                    <p className="text-2xl font-bold text-gray-900">{stats.electiveClasses}</p>
                    <p className="text-xs text-gray-500">Elective Classes</p>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <Link href="/teacher/attendance" className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center gap-3 hover:bg-indigo-100 transition-colors">
                    <div className="p-2 bg-indigo-100 rounded-lg">
                        <ClipboardCheck className="text-indigo-600" size={24} />
                    </div>
                    <div>
                        <p className="font-semibold text-indigo-900">Take Attendance</p>
                        <p className="text-xs text-indigo-700">Mark today&apos;s attendance</p>
                    </div>
                </Link>
                <Link href="/teacher/electives" className="bg-purple-50 border border-purple-200 rounded-xl p-4 flex items-center gap-3 hover:bg-purple-100 transition-colors">
                    <div className="p-2 bg-purple-100 rounded-lg">
                        <BookOpen className="text-purple-600" size={24} />
                    </div>
                    <div>
                        <p className="font-semibold text-purple-900">Elective Classes</p>
                        <p className="text-xs text-purple-700">View your electives</p>
                    </div>
                </Link>
            </div>

            {/* My Classrooms */}
            <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-3">My Classrooms</h3>
                <div className="grid gap-4">
                    {classes.length > 0 ? classes.map((cls: any) => (
                        <Link
                            key={cls.id}
                            href={`/teacher/classroom/${cls.id}`}
                            className="group bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex items-center justify-between hover:border-indigo-200 transition-colors"
                        >
                            <div className="flex items-center gap-4">
                                <div className={`w-3 h-3 rounded-full ${cls.attendanceMarked ? 'bg-green-500' : 'bg-amber-400'}`}></div>
                                <div>
                                    <h4 className="font-bold text-gray-900">{cls.name}</h4>
                                    <p className="text-sm text-gray-500">{cls.studentCount} students</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {!cls.attendanceMarked && (
                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">Pending</span>
                                )}
                                <ChevronRight className="text-gray-300 group-hover:text-indigo-500 transition-colors" />
                            </div>
                        </Link>
                    )) : (
                        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300">
                            <p className="text-gray-500">No classes assigned yet.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
