'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { X, Save } from 'lucide-react';

interface Props {
    student?: any; // If passed, editing mode
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function StudentForm({ student, isOpen, onClose, onSuccess }: Props) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [classroomId, setClassroomId] = useState('');
    const [gradeId, setGradeId] = useState('');
    const [classrooms, setClassrooms] = useState<any[]>([]);
    const [grades, setGrades] = useState<any[]>([]);

    useEffect(() => {
        if (isOpen) {
            fetchMetaData();
            if (student) {
                setFirstName(student.first_name);
                setLastName(student.last_name);
                setClassroomId(student.classroom_id);
                setGradeId(student.grade_id);
            } else {
                setFirstName('');
                setLastName('');
                setClassroomId('');
                setGradeId('');
            }
        }
    }, [isOpen, student]);

    const fetchMetaData = async () => {
        const { data: cls } = await supabase.from('classrooms').select('*').order('name');
        const { data: grds } = await supabase.from('grades').select('*').order('order');
        if (cls) setClassrooms(cls);
        if (grds) setGrades(grds);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            first_name: firstName,
            last_name: lastName,
            classroom_id: classroomId,
            grade_id: gradeId
        };

        let err;

        if (student) {
            // Update
            const { error } = await supabase.from('students').update(payload).eq('id', student.id);
            err = error;
        } else {
            // Create
            const { error } = await supabase.from('students').insert([payload]);
            err = error;
        }

        if (err) {
            alert('Error: ' + err.message);
        } else {
            onSuccess();
            onClose();
        }
        setLoading(false);
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
