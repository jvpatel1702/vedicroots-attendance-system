'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Plus, Edit } from 'lucide-react';
import TeacherForm from '@/components/admin/TeacherForm';

interface TeacherClassroom {
    classrooms: { name: string } | null;
}

interface TeacherProfile {
    id: string;
    name: string;
    email: string;
    teacher_classrooms: TeacherClassroom[];
}

export default function TeachersPage() {
    const supabase = createClient();
    const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingTeacher, setEditingTeacher] = useState<TeacherProfile | null>(null);

    const fetchTeachers = useCallback(async () => {
        setLoading(true);
        // Fetch staff with role teacher AND their assigned classrooms
        const { data: staffList } = await supabase
            .from('staff')
            .select(`
                id,
                email,
                role,
                persons (first_name, last_name),
                teacher_classrooms (
                    classrooms (name)
                )
            `)
            .eq('role', 'TEACHER');

        if (staffList) {
            const mappedTeachers: TeacherProfile[] = staffList.map((s: any) => ({
                id: s.id,
                name: s.persons ? `${s.persons.first_name} ${s.persons.last_name}` : 'Unknown',
                email: s.email || '',
                teacher_classrooms: s.teacher_classrooms
            }));
            setTeachers(mappedTeachers);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchTeachers();
    }, [fetchTeachers]);

    const handleEdit = (teacher: TeacherProfile) => {
        setEditingTeacher(teacher);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setEditingTeacher(null);
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Teachers</h2>
                    <p className="text-gray-500 text-sm">Manage teaching staff and assignments.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={18} /> Add Teacher
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Assigned Classes</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading teachers...</td></tr>
                        ) : teachers.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">No teachers found.</td></tr>
                        ) : (
                            teachers.map(teacher => (
                                <tr key={teacher.id} className="hover:bg-gray-50 group transition-colors">
                                    <td className="px-6 py-4 font-semibold text-gray-900">{teacher.name}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{teacher.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div className="flex flex-wrap gap-1">
                                            {teacher.teacher_classrooms?.map((tc, i) => (
                                                <span key={i} className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs border border-blue-100">
                                                    {tc.classrooms?.name}
                                                </span>
                                            ))}
                                            {(!teacher.teacher_classrooms || teacher.teacher_classrooms.length === 0) && (
                                                <span className="text-gray-400 italic">None</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => handleEdit(teacher)}
                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Edit size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <TeacherForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                teacher={editingTeacher}
                onSuccess={fetchTeachers}
            />
        </div>
    );
}
