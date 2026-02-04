'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { X, Save } from 'lucide-react';

interface Props {
    teacher?: {
        id: string;
        name: string;
        email: string;
    } | null; // If passed, editing mode
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Classroom {
    id: string;
    name: string;
}

export default function TeacherForm({ teacher, isOpen, onClose, onSuccess }: Props) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [classroomId, setClassroomId] = useState(''); // Primary assignment
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);

    useEffect(() => {
        const fetchClassrooms = async () => {
            const { data } = await supabase.from('classrooms').select('*').order('name');
            if (data) setClassrooms(data);
        };

        if (isOpen) {
            fetchClassrooms();
            if (teacher) {
                setName(teacher.name);
                setEmail(teacher.email);
                // Currently only getting one assignment for simplicity in this form.
                // In a real app we might handle multiple assignments via a junction table check.
            } else {
                setName('');
                setEmail('');
                setClassroomId('');
            }
        }
    }, [isOpen, teacher, supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            name: name,
            email: email,
            role: 'TEACHER'
        };

        let teacherId = teacher?.id;
        let err;

        if (teacher) {
            // Update Profile
            const { error } = await supabase.from('profiles').update(payload).eq('id', teacher.id);
            err = error;
        } else {
            // Create Profile (Note: This doesn't create Auth user, just the profile record)
            const { data, error } = await supabase.from('profiles').insert([payload]).select().single();
            err = error;
            if (data) teacherId = data.id;
        }

        if (err) {
            alert('Error saving profile: ' + err.message);
            setLoading(false);
            return;
        }

        // Handle Classroom Assignment
        if (classroomId && teacherId) {
            // Clear existing for simplicity or add new?
            // Let's simple "Upsert" logic: Delete old, add new
            await supabase.from('teacher_classrooms').delete().eq('teacher_id', teacherId);

            const { error: assignError } = await supabase.from('teacher_classrooms').insert([{
                teacher_id: teacherId,
                classroom_id: classroomId
            }]);

            if (assignError) alert('Error assigning class: ' + assignError.message);
        }

        onSuccess();
        onClose();
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 className="font-bold text-gray-900">{teacher ? 'Edit Teacher' : 'Add Teacher'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none"
                        />
                        {!teacher && <p className="text-xs text-gray-500 mt-1">Note: This creates a profile only. User must sign up with this email.</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Assign Classroom</label>
                        <select
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

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-olive text-white font-bold py-3 rounded-lg hover:bg-opacity-90 flex items-center justify-center gap-2 transition-opacity"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Teacher'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
