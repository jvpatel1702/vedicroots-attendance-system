'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useOrganization } from '@/context/OrganizationContext';
import { ArrowLeft, User, GraduationCap, Calendar, CheckCircle, XCircle, Clock, Activity, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface EnrollmentDetail {
    id: string;
    student_id: string;
    classroom_id: string;
    grade_id: string;
    status: string;
    enrollment_date: string;
    start_date: string;
    end_date: string | null;
    student: {
        id: string;
        person: {
            first_name: string;
            last_name: string;
            photo_url?: string;
        };
        medical: {
            allergies: string;
            medical_conditions: string;
            medications: string;
        } | null;
    };
    classroom: {
        id: string;
        name: string;
        location: {
            name: string;
        }
    };
    grade: {
        name: string;
    };
    academic_year: {
        name: string;
    };
}

interface AttendanceStats {
    present: number;
    absent: number;
    late: number;
    total: number;
}

export default function EnrollmentDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const supabase = createClient();
    const { selectedOrganization } = useOrganization();

    const [enrollment, setEnrollment] = useState<EnrollmentDetail | null>(null);
    const [stats, setStats] = useState<AttendanceStats>({ present: 0, absent: 0, late: 0, total: 0 });
    const [loading, setLoading] = useState(true);

    const fetchEnrollmentDetails = useCallback(async () => {
        if (!selectedOrganization) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('enrollments')
            .select(`
                id,
                student_id,
                classroom_id,
                grade_id,
                status,
                enrollment_date,
                start_date,
                end_date,
                student:students (
                    id,
                    person:persons (
                        first_name,
                        last_name,
                        photo_url
                    ),
                    medical:student_medical (
                        allergies,
                        medical_conditions,
                        medications
                    )
                ),
                classroom:classrooms (
                    id,
                    name,
                    location:locations (
                        name
                    )
                ),
                grade:grades (
                    name
                ),
                academic_year:academic_years (
                    name
                )
            `)
            .eq('id', id)
            .single();

        if (error) {
            console.error('Error fetching enrollment details:', error);
        } else if (data) {
            setEnrollment(data as any);
            // Fetch attendance stats for this student in this academic year (simple approx)
            if (data.student_id) {
                const { data: attendanceData } = await supabase
                    .from('attendance')
                    .select('status')
                    .eq('student_id', data.student_id);

                if (attendanceData) {
                    const present = attendanceData.filter(a => a.status === 'PRESENT').length;
                    const absent = attendanceData.filter(a => a.status === 'ABSENT').length;
                    const late = attendanceData.filter(a => a.status === 'LATE').length;
                    setStats({
                        present,
                        absent,
                        late,
                        total: attendanceData.length
                    });
                }
            }
        }

        setLoading(false);
    }, [id, selectedOrganization, supabase]);

    useEffect(() => {
        fetchEnrollmentDetails();
    }, [fetchEnrollmentDetails]);

    if (!selectedOrganization) return <div className="p-6">Please select an organization.</div>;
    if (loading) return <div className="p-6">Loading enrollment details...</div>;
    if (!enrollment) return <div className="p-6">Enrollment record not found.</div>;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ACTIVE': return 'bg-green-100 text-green-700';
            case 'INACTIVE': return 'bg-red-100 text-red-700';
            case 'GRADUATED': return 'bg-blue-100 text-blue-700';
            case 'WITHDRAWN': return 'bg-orange-100 text-orange-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/enrollments"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Enrollment Details</h1>
                    <p className="text-sm text-gray-500">
                        {enrollment.academic_year?.name || 'Unknown Year'}
                    </p>
                </div>
                <div className="ml-auto">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(enrollment.status)}`}>
                        {enrollment.status}
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Student Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <User size={18} className="text-indigo-600" />
                        Student Information
                    </h2>
                    <div className="flex items-center gap-4 mb-4">
                        <div className="h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 font-bold overflow-hidden">
                            {enrollment.student.person.photo_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={enrollment.student.person.photo_url} alt="Profile" className="h-full w-full object-cover" />
                            ) : (
                                enrollment.student.person.first_name[0]
                            )}
                        </div>
                        <div>
                            <Link
                                href={`/admin/students/${enrollment.student_id}`}
                                className="text-lg font-semibold text-gray-900 hover:text-indigo-600 hover:underline"
                            >
                                {enrollment.student.person.first_name} {enrollment.student.person.last_name}
                            </Link>
                            <p className="text-sm text-gray-500">View Student Profile</p>
                        </div>
                    </div>
                    {/* Medical Badge / Quick Info */}
                    {enrollment.student.medical && (enrollment.student.medical.allergies || enrollment.student.medical.medical_conditions) && (
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                            <div className="flex items-start gap-2">
                                <AlertCircle size={16} className="text-red-500 mt-0.5" />
                                <div>
                                    <p className="text-xs font-bold text-red-800 uppercase">Medical Alert</p>
                                    {enrollment.student.medical.allergies && (
                                        <p className="text-sm text-red-700">Allergies: {enrollment.student.medical.allergies}</p>
                                    )}
                                    {enrollment.student.medical.medical_conditions && (
                                        <p className="text-sm text-red-700">Conditions: {enrollment.student.medical.medical_conditions}</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Classroom Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <GraduationCap size={18} className="text-indigo-600" />
                        Classroom & Grade
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Classroom</label>
                            <Link
                                href={`/admin/classrooms/${enrollment.classroom_id}`}
                                className="block text-lg font-medium text-gray-900 hover:text-indigo-600 hover:underline"
                            >
                                {enrollment.classroom?.name || 'Unassigned'}
                            </Link>
                            <p className="text-xs text-gray-400">{enrollment.classroom?.location?.name}</p>
                        </div>
                        <div>
                            <label className="text-xs text-gray-500 uppercase font-semibold">Grade Level</label>
                            <p className="text-gray-900">{enrollment.grade?.name || 'N/A'}</p>
                        </div>
                    </div>
                </div>

                {/* Attendance Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Activity size={18} className="text-teal-600" />
                        Attendance Overview
                    </h2>
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <p className="text-xl font-bold text-green-700">{stats.present}</p>
                            <p className="text-xs text-green-600 uppercase font-semibold">Present</p>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg">
                            <p className="text-xl font-bold text-red-700">{stats.absent}</p>
                            <p className="text-xs text-red-600 uppercase font-semibold">Absent</p>
                        </div>
                        <div className="p-2 bg-yellow-50 rounded-lg">
                            <p className="text-xl font-bold text-yellow-700">{stats.late}</p>
                            <p className="text-xs text-yellow-600 uppercase font-semibold">Late</p>
                        </div>
                    </div>
                </div>

                {/* Status & Dates */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Calendar size={18} className="text-indigo-600" />
                        Timeline
                    </h2>
                    <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-600">Start Date</span>
                            <span className="text-sm font-medium text-gray-900">
                                {enrollment.start_date ? new Date(enrollment.start_date).toLocaleDateString() : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-600">End Date</span>
                            <span className="text-sm font-medium text-gray-900">
                                {enrollment.end_date ? new Date(enrollment.end_date).toLocaleDateString() : '-'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-50">
                            <span className="text-sm text-gray-600">Current Status</span>
                            <span className="text-sm font-medium text-gray-900">{enrollment.status}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
