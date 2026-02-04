'use client';

import { useEffect, useState, use, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Save, Info, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/useUser';
import { isPastCutoff, GradeType, SchoolSettings } from '@/lib/attendanceTime';
import { isStudentOnVacation, StudentVacation } from '@/lib/classroomUtils';
import SwipeableStudentItem from '@/components/SwipeableStudentItem';

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
    status?: 'PRESENT' | 'ABSENT' | 'LATE' | 'UNMARKED';
    attendance_id?: string;
    arrival_time?: string;
    grade_type?: GradeType;
}

export default function ClassroomPage(props: { params: Promise<{ classId: string }> }) {
    const params = use(props.params);
    const classId = params.classId;
    const supabase = createClient();
    const { isDev } = useUser();

    // State
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<SchoolSettings | null>(null);
    const [gradeType, setGradeType] = useState<GradeType>('ELEMENTARY'); // Default
    const [isPastCutoffState, setIsPastCutoffState] = useState(false);
    const [date] = useState(new Date().toISOString().split('T')[0]);

    const router = useRouter();

    const checkTime = useCallback(() => {
        if (!settings) return;
        const past = isPastCutoff(gradeType, settings);
        setIsPastCutoffState(past);
    }, [gradeType, settings]);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            // 1. Fetch School Settings
            let currentSettings: SchoolSettings = {
                cutoff_time_kg: '09:15:00',
                cutoff_time_elementary: '09:00:00'
            };

            if (!isDev) {
                const { data: settingsData } = await supabase.from('school_settings').select('*').single();
                if (settingsData) {
                    currentSettings = settingsData;
                }
            }
            setSettings(currentSettings);

            // 2. Fetch Class Info (to get Grade Type)
            let currentGradeType: GradeType = 'ELEMENTARY';

            if (!isDev) {
                const { data: gradeData } = await supabase
                    .from('classroom_grades')
                    .select('grades(type)')
                    .eq('classroom_id', classId)
                    .limit(1)
                    .single();

                if (gradeData?.grades) {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    currentGradeType = (gradeData.grades as any).type as GradeType;
                }
            } else {
                if (classId.includes('kg')) currentGradeType = 'KINDERGARTEN';
            }
            setGradeType(currentGradeType);

            // 3. Fetch Students & Attendance & Vacations
            if (isDev) {
                setStudents([
                    { id: 's1', first_name: 'Aarav', last_name: 'Sharma', status: 'UNMARKED', grade_type: 'KINDERGARTEN' },
                    { id: 's2', first_name: 'Ishani', last_name: 'Verma', status: 'UNMARKED', grade_type: 'KINDERGARTEN' },
                ]);
            } else {
                const { data: studentData } = await supabase
                    .from('students')
                    .select('*')
                    .eq('classroom_id', classId)
                    .order('first_name');

                const { data: attendanceData } = await supabase
                    .from('attendance')
                    .select('*')
                    .eq('date', date)
                    .in('student_id', (studentData || []).map(s => s.id));

                const { data: vacationData } = await supabase
                    .from('student_vacations')
                    .select('*')
                    .gte('end_date', date);

                const merged = (studentData || [])
                    .filter(s => !isStudentOnVacation(s.id, (vacationData || []) as StudentVacation[]))
                    .map(student => {
                        const record = attendanceData?.find(a => a.student_id === student.id);
                        return {
                            ...student,
                            status: record?.status || 'UNMARKED',
                            attendance_id: record?.id,
                            arrival_time: record?.arrival_time,
                            grade_type: currentGradeType
                        };
                    });

                setStudents(merged as Student[]);
            }

        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [classId, date, isDev, supabase]);

    useEffect(() => {
        fetchData();
        // Removed unused interval logic here as it is handled below
    }, [fetchData]);

    // Separate effect for time check interval
    useEffect(() => {
        const interval = setInterval(checkTime, 30000);
        return () => clearInterval(interval);
    }, [checkTime]);

    // Initial check when data loaded
    useEffect(() => {
        checkTime();
    }, [checkTime]);

    const markAttendance = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE') => {
        let arrivalTime = undefined;
        if (status === 'LATE') {
            arrivalTime = new Date().toTimeString().split(' ')[0];
        }

        setStudents(prev => prev.map(s =>
            s.id === studentId ? { ...s, status, arrival_time: arrivalTime } : s
        ));
    };

    const saveAttendance = async () => {
        setSaving(true);
        if (isDev) {
            await new Promise(r => setTimeout(r, 1000));
            setSaving(false);
            return;
        }

        const updates = students
            .filter(s => s.status !== 'UNMARKED')
            .map(s => ({
                student_id: s.id,
                date: date,
                status: s.status,
                arrival_time: s.arrival_time
            }));

        const { error } = await supabase
            .from('attendance')
            .upsert(updates, { onConflict: 'student_id,date' });

        if (error) alert('Error: ' + error.message);
        else router.refresh();

        setSaving(false);
    };

    const allMarked = students.length > 0 && students.every(s => s.status && s.status !== 'UNMARKED');

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-indigo-500" /></div>;

    return (
        <div className="pb-32 px-4 max-w-lg mx-auto">
            <div className="flex flex-col gap-2 mb-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Attendance</h2>
                    <div className="text-sm text-gray-500 font-medium">
                        {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                    </div>
                </div>

                {/* Status Bar */}
                <div className={`flex items-center gap-2 text-sm px-4 py-3 rounded-lg border ${isPastCutoffState ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-green-50 text-green-700 border-green-200'}`}>
                    <Info size={18} />
                    <span>
                        {isPastCutoffState
                            ? `Cutoff passed. Only "LATE" marking allowed.`
                            : `Drop-off window open until ${gradeType === 'KINDERGARTEN' ? settings?.cutoff_time_kg : settings?.cutoff_time_elementary}.`
                        }
                    </span>
                </div>
            </div>

            <div className="space-y-4">
                {students.map(student => (
                    <SwipeableStudentItem
                        key={student.id}
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        student={student as any}
                        onMark={markAttendance}
                        isPastCutoff={isPastCutoffState}
                    />
                ))}

                {students.length === 0 && (
                    <div className="text-center py-10 text-gray-400">No students found.</div>
                )}
            </div>

            {/* Save Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-md border-t border-gray-200">
                <button
                    onClick={saveAttendance}
                    disabled={saving || !allMarked}
                    className="w-full max-w-lg mx-auto bg-black text-white font-bold py-4 px-6 rounded-2xl shadow-lg flex items-center justify-center gap-2 hover:bg-gray-900 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                >
                    {saving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                    {saving ? 'Saving...' : allMarked ? 'Submit Attendance' : 'Mark All to Submit'}
                </button>
            </div>
        </div>
    );
}
