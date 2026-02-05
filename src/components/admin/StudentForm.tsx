'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { X, Save } from 'lucide-react';

interface Props {
    student?: {
        id: string;
        first_name: string;
        last_name: string;
        enrollments?: {
            classrooms: { id: string; name: string } | null;
            grades: { id: string; name: string } | null;
            classroom_id: string; // Direct ID from enrollment
            grade_id: string;     // Direct ID from enrollment
            status: string;
        }[];
    } | null;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Classroom { id: string; name: string; }
interface Grade { id: string; name: string; }

export default function StudentForm({ student, isOpen, onClose, onSuccess }: Props) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [classroomId, setClassroomId] = useState('');
    const [gradeId, setGradeId] = useState('');
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);

    useEffect(() => {
        const fetchMetaData = async () => {
            const { data: cls } = await supabase.from('classrooms').select('*').order('name');
            const { data: grds } = await supabase.from('grades').select('*').order('order');
            if (cls) setClassrooms(cls);
            if (grds) setGrades(grds);
        };

        if (isOpen) {
            fetchMetaData();
            if (student) {
                setFirstName(student.first_name);
                setLastName(student.last_name);

                // Find active enrollment to populate form
                const active = student.enrollments?.find(e => e.status === 'ACTIVE');
                if (active) {
                    // Use IDs directly if available in the joined object, otherwise we need to rely on what Supabase returned
                    // Note: In Students Page we selected `enrollments(status, classrooms(name), grades(name))`.
                    // We need actual IDs for the form.
                    // Ideally, the parent component should pass IDs. 
                    // Let's assume for now we might not have them if parent didn't fetch them.
                    // FIX: Parent MUST fetch *_id from enrollments.
                    // I will update this assuming parent provides.
                    setClassroomId(active.classroom_id || '');
                    setGradeId(active.grade_id || '');
                } else {
                    setClassroomId('');
                    setGradeId('');
                }
            } else {
                setFirstName('');
                setLastName('');
                setClassroomId('');
                setGradeId('');
            }
        }
    }, [isOpen, student, supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let studentId = student?.id;

            // 1. Upsert Student Profile
            const studentPayload = {
                first_name: firstName,
                last_name: lastName,
                // generate student number if new? Database handles unique, but trigger might be needed or manual logic.
                // allowing default or NULL for now.
            };

            if (student) {
                const { error } = await supabase.from('students').update(studentPayload).eq('id', student.id);
                if (error) throw error;
            } else {
                const { data, error } = await supabase.from('students').insert([studentPayload]).select().single();
                if (error) throw error;
                studentId = data.id;
            }

            // 2. Manage Enrollment
            if (studentId && classroomId && gradeId) {
                // Fetch current academic year - Hardcoded for Phase 1 or fetch active
                const { data: yearData } = await supabase.from('academic_years').select('id').eq('is_active', true).single();

                if (yearData) {
                    // Check existing active enrollment
                    const { data: existing } = await supabase
                        .from('enrollments')
                        .select('id')
                        .eq('student_id', studentId)
                        .eq('status', 'ACTIVE')
                        .single();

                    if (existing) {
                        // Update existing enrollment
                        await supabase.from('enrollments').update({
                            classroom_id: classroomId,
                            grade_id: gradeId
                        }).eq('id', existing.id);
                    } else {
                        // Create new enrollment
                        await supabase.from('enrollments').insert({
                            student_id: studentId,
                            classroom_id: classroomId,
                            grade_id: gradeId,
                            academic_year_id: yearData.id,
                            status: 'ACTIVE'
                        });
                    }
                }
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            alert('Error: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 className="font-bold text-gray-900">{student ? 'Edit Student' : 'Add Student'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                            <input
                                type="text"
                                required
                                value={firstName}
                                onChange={e => setFirstName(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                            <input
                                type="text"
                                required
                                value={lastName}
                                onChange={e => setLastName(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Classroom</label>
                        <select
                            required
                            value={classroomId}
                            onChange={e => setClassroomId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none bg-white"
                        >
                            <option value="">Select Classroom</option>
                            {classrooms.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Grade</label>
                        <select
                            required
                            value={gradeId}
                            onChange={e => setGradeId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none bg-white"
                        >
                            <option value="">Select Grade</option>
                            {grades.map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                    </div>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-olive text-white font-bold py-3 rounded-lg hover:bg-opacity-90 flex items-center justify-center gap-2 transition-opacity"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Student'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
