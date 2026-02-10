'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useUser } from '@/lib/useUser';
import { ClipboardCheck, Users, Check, X, Clock, Save } from 'lucide-react';

interface Student {
    id: string;
    student_number: string;
    person: { first_name: string; last_name: string };
}

interface Classroom {
    id: string;
    name: string;
}

interface AttendanceRecord {
    student_id: string;
    status: 'PRESENT' | 'ABSENT' | 'LATE' | null;
}

export default function TeacherAttendancePage() {
    const supabase = createClient();
    const { user, loading: userLoading, isDev } = useUser();

    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [selectedClassroom, setSelectedClassroom] = useState<string>('');
    const [students, setStudents] = useState<Student[]>([]);
    const [attendance, setAttendance] = useState<Record<string, AttendanceRecord['status']>>({});
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [date] = useState(new Date().toISOString().split('T')[0]);

    // Fetch teacher's classrooms
    const fetchClassrooms = useCallback(async () => {
        if (!user && !isDev) return;

        if (isDev) {
            setClassrooms([
                { id: 'c1-dev', name: 'Ashoka House (Dev)' },
                { id: 'c2-dev', name: 'Banyan House (Dev)' },
            ]);
            setLoading(false);
            return;
        }

        const { data } = await supabase
            .from('teacher_classrooms')
            .select('classrooms(id, name)')
            .eq('teacher_id', user!.id);

        if (data) {
            const formatted = data.map((item: any) => item.classrooms).filter(Boolean);
            setClassrooms(formatted);
            if (formatted.length > 0) {
                setSelectedClassroom(formatted[0].id);
            }
        }
        setLoading(false);
    }, [supabase, user, isDev]);

    // Fetch students and attendance for selected classroom
    const fetchStudentsAndAttendance = useCallback(async () => {
        if (!selectedClassroom) return;

        if (isDev) {
            setStudents([
                { id: 's1', student_number: 'S001', person: { first_name: 'Aarav', last_name: 'Sharma' } },
                { id: 's2', student_number: 'S002', person: { first_name: 'Ishani', last_name: 'Verma' } },
                { id: 's3', student_number: 'S003', person: { first_name: 'Vihaan', last_name: 'Gupta' } },
            ]);
            setAttendance({ s1: 'PRESENT', s2: null, s3: null });
            return;
        }

        // Fetch students enrolled in classroom
        const { data: enrollments } = await supabase
            .from('enrollments')
            .select(`
                student:students(
                    id, student_number,
                    person:persons(first_name, last_name)
                )
            `)
            .eq('classroom_id', selectedClassroom)
            .eq('status', 'ACTIVE');

        if (enrollments) {
            const studentList = enrollments
                .map((e: any) => e.student)
                .filter(Boolean)
                .filter((s: any) => s.person);
            setStudents(studentList);

            // Fetch existing attendance for today
            const studentIds = studentList.map((s: any) => s.id);
            if (studentIds.length > 0) {
                const { data: attendanceData } = await supabase
                    .from('attendance')
                    .select('student_id, status')
                    .eq('date', date)
                    .in('student_id', studentIds);

                const attendanceMap: Record<string, AttendanceRecord['status']> = {};
                studentIds.forEach(id => attendanceMap[id] = null);
                attendanceData?.forEach((a: any) => attendanceMap[a.student_id] = a.status);
                setAttendance(attendanceMap);
            }
        }
    }, [supabase, selectedClassroom, date, isDev]);

    useEffect(() => {
        if (!userLoading) fetchClassrooms();
    }, [userLoading, fetchClassrooms]);

    useEffect(() => {
        if (selectedClassroom) fetchStudentsAndAttendance();
    }, [selectedClassroom, fetchStudentsAndAttendance]);

    const markAttendance = (studentId: string, status: AttendanceRecord['status']) => {
        setAttendance(prev => ({ ...prev, [studentId]: status }));
    };

    const markAllPresent = () => {
        const newAttendance: Record<string, AttendanceRecord['status']> = {};
        students.forEach(s => newAttendance[s.id] = 'PRESENT');
        setAttendance(newAttendance);
    };

    const saveAttendance = async () => {
        setSaving(true);
        const records = Object.entries(attendance)
            .filter(([, status]) => status !== null)
            .map(([student_id, status]) => ({
                student_id,
                date,
                status,
                marked_by: user?.id || null
            }));

        if (records.length > 0 && !isDev) {
            const { error } = await supabase
                .from('attendance')
                .upsert(records, { onConflict: 'student_id,date' });

            if (error) {
                alert('Error saving attendance: ' + error.message);
            } else {
                alert('Attendance saved successfully!');
            }
        } else if (isDev) {
            alert('Dev mode: Attendance would be saved');
        }
        setSaving(false);
    };

    const markedCount = Object.values(attendance).filter(s => s !== null).length;
    const presentCount = Object.values(attendance).filter(s => s === 'PRESENT').length;
    const absentCount = Object.values(attendance).filter(s => s === 'ABSENT').length;

    if (userLoading || loading) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <ClipboardCheck className="text-indigo-600" />
                        Attendance
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                </div>
                <div className="flex gap-3">
                    <select
                        value={selectedClassroom}
                        onChange={e => setSelectedClassroom(e.target.value)}
                        className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    >
                        {classrooms.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-4 text-center">
                    <Users className="mx-auto text-gray-400 mb-2" size={24} />
                    <p className="text-2xl font-bold text-gray-900">{students.length}</p>
                    <p className="text-xs text-gray-500">Total Students</p>
                </div>
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                    <Check className="mx-auto text-green-600 mb-2" size={24} />
                    <p className="text-2xl font-bold text-green-700">{presentCount}</p>
                    <p className="text-xs text-green-600">Present</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                    <X className="mx-auto text-red-600 mb-2" size={24} />
                    <p className="text-2xl font-bold text-red-700">{absentCount}</p>
                    <p className="text-xs text-red-600">Absent</p>
                </div>
            </div>

            {/* Attendance List */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-semibold text-gray-900">Students ({markedCount}/{students.length} marked)</h3>
                    <button
                        onClick={markAllPresent}
                        className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
                    >
                        Mark All Present
                    </button>
                </div>

                <div className="divide-y divide-gray-100">
                    {students.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">No students in this class.</div>
                    ) : (
                        students.map(student => (
                            <div key={student.id} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {student.person.first_name} {student.person.last_name}
                                    </p>
                                    <p className="text-xs text-gray-500">{student.student_number}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => markAttendance(student.id, 'PRESENT')}
                                        className={`p-2 rounded-lg transition-colors ${attendance[student.id] === 'PRESENT'
                                                ? 'bg-green-500 text-white'
                                                : 'bg-gray-100 text-gray-500 hover:bg-green-100 hover:text-green-600'
                                            }`}
                                    >
                                        <Check size={18} />
                                    </button>
                                    <button
                                        onClick={() => markAttendance(student.id, 'ABSENT')}
                                        className={`p-2 rounded-lg transition-colors ${attendance[student.id] === 'ABSENT'
                                                ? 'bg-red-500 text-white'
                                                : 'bg-gray-100 text-gray-500 hover:bg-red-100 hover:text-red-600'
                                            }`}
                                    >
                                        <X size={18} />
                                    </button>
                                    <button
                                        onClick={() => markAttendance(student.id, 'LATE')}
                                        className={`p-2 rounded-lg transition-colors ${attendance[student.id] === 'LATE'
                                                ? 'bg-yellow-500 text-white'
                                                : 'bg-gray-100 text-gray-500 hover:bg-yellow-100 hover:text-yellow-600'
                                            }`}
                                    >
                                        <Clock size={18} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Save Button */}
            {students.length > 0 && (
                <div className="fixed bottom-6 left-1/2 -translate-x-1/2 md:static md:translate-x-0">
                    <button
                        onClick={saveAttendance}
                        disabled={saving || markedCount === 0}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Save size={18} />
                        {saving ? 'Saving...' : `Save Attendance (${markedCount}/${students.length})`}
                    </button>
                </div>
            )}
        </div>
    );
}
