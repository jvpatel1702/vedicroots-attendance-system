/**
 * Students Index Page (Admin)
 * ---------------------------
 * Displays a list of all students.
 * 
 * Key Data Structure:
 * - joins `persons` to get first_name, last_name, photo.
 * - joins `enrollments` -> `classrooms` to get current class info.
 * 
 * Note: strict typing here is crucial as it shapes the entire data flow.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Plus, Edit, Calendar } from 'lucide-react';
import StudentForm from '@/components/admin/StudentForm';
import VacationModal from '@/components/admin/VacationModal';

interface Student {
    id: string;
    student_number: string;
    person: {
        first_name: string;
        last_name: string;
        photo_url?: string;
    };
    enrollments?: {
        classrooms: { id: string; name: string } | null;
        grades: { id: string; name: string } | null;
        classroom_id: string;
        grade_id: string;
        status: string;
    }[];
}

export default function StudentsPage() {
    const supabase = createClient();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);

    // Modals
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [vacationStudent, setVacationStudent] = useState<Student | null>(null);

    const fetchStudents = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('students')
            .select(`
                *,
                person:persons (
                    first_name,
                    last_name,
                    photo_url
                ),
                enrollments (
                    status,
                    classroom_id,
                    grade_id,
                    classrooms (id, name),
                    grades (id, name)
                )
            `);
        // .order('person(first_name)'); // Ordering by joined column is tricky in Supabase syntax sometimes, letting it slide or doing client side sort

        if (error) {
            console.error('Error fetching students:', error);
        }

        if (data) setStudents(data as unknown as Student[]);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchStudents();
    }, [fetchStudents]);

    const handleEdit = (student: Student) => {
        setEditingStudent(student);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setEditingStudent(null);
        setIsFormOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Students</h2>
                    <p className="text-gray-500 text-sm">Manage student enrollment and details.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={18} /> Add Student
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Details</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Classroom</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">Loading students...</td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan={4} className="p-8 text-center text-gray-400">No students found.</td></tr>
                        ) : (
                            students.map(student => (
                                <tr key={student.id} className="hover:bg-gray-50 group transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold overflow-hidden border border-indigo-100">
                                                {student.person.photo_url ? (
                                                    /* eslint-disable-next-line @next/next/no-img-element */
                                                    <img src={student.person.photo_url} alt={student.person.first_name} className="h-full w-full object-cover" />
                                                ) : (
                                                    student.person.first_name[0]
                                                )}
                                            </div>
                                            <div>
                                                <p className="font-semibold text-gray-900">{student.person.first_name} {student.person.last_name}</p>
                                                <p className="text-xs text-gray-400">ID: {student.student_number}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {(() => {
                                            const active = student.enrollments?.find(e => e.status === 'ACTIVE');
                                            return active?.classrooms?.name || 'Unassigned';
                                        })()}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                                            {(() => {
                                                const active = student.enrollments?.find(e => e.status === 'ACTIVE');
                                                return active?.grades?.name || 'N/A';
                                            })()}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => setVacationStudent(student)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg tooltip"
                                                title="Manage Vacations"
                                            >
                                                <Calendar size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleEdit(student)}
                                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                                title="Edit Details"
                                            >
                                                <Edit size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modals */}
            <StudentForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                student={editingStudent}
                onSuccess={fetchStudents}
            />

            {vacationStudent && (
                <VacationModal
                    isOpen={!!vacationStudent}
                    onClose={() => setVacationStudent(null)}
                    studentId={vacationStudent.id}
                    studentName={`${vacationStudent.person.first_name} ${vacationStudent.person.last_name}`}
                />
            )}
        </div>
    );
}
