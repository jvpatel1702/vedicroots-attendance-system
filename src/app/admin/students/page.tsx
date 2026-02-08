/**
 * Students Index Page (Admin)
 * ---------------------------
 * Displays a list of all students with bulk actions support.
 * 
 * Key Data Structure:
 * - joins `persons` to get first_name, last_name, photo.
 * - joins `enrollments` -> `classrooms` to get current class info.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Plus, Edit, Calendar, FileSpreadsheet, Trash2, Users, CheckSquare, Square, X, GraduationCap } from 'lucide-react';
import StudentForm from '@/components/admin/StudentForm';
import VacationModal from '@/components/admin/VacationModal';
import CsvStudentImport from '@/components/admin/CsvStudentImport';
import { useOrganization } from '@/context/OrganizationContext';

interface Student {
    id: string;
    student_number: string;
    person: {
        first_name: string;
        last_name: string;
        photo_url?: string;
    };
    medical?: {
        allergies: string;
        medical_conditions: string;
        medications: string;
        doctor_name: string;
        doctor_phone: string;
    };
    enrollments?: {
        classrooms: { id: string; name: string } | null;
        grades: { id: string; name: string } | null;
        classroom_id: string;
        grade_id: string;
        status: string;
    }[];
}

interface Classroom {
    id: string;
    name: string;
}

interface Grade {
    id: string;
    name: string;
}

export default function StudentsPage() {
    const supabase = createClient();
    const { selectedOrganization } = useOrganization();
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);

    // Selection state
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [bulkAction, setBulkAction] = useState<'move' | 'status' | 'grade' | 'delete' | null>(null);
    const [targetClassroom, setTargetClassroom] = useState<string>('');
    const [targetStatus, setTargetStatus] = useState<string>('ACTIVE');
    const [processing, setProcessing] = useState(false);
    const [targetGrade, setTargetGrade] = useState<string>('');

    // Modals
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
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
                medical:student_medical (
                    allergies,
                    medical_conditions,
                    medications,
                    doctor_name,
                    doctor_phone
                ),
                enrollments (
                    status,
                    classroom_id,
                    grade_id,
                    classrooms (id, name),
                    grades (id, name)
                )
            `);

        if (error) {
            console.error('Error fetching students:', error);
        }

        if (data) {
            const validStudents = (data as unknown as Student[]).filter(student => student.person);
            setStudents(validStudents);
        }
        setLoading(false);
    }, [supabase]);

    const fetchClassrooms = useCallback(async () => {
        if (!selectedOrganization) return;
        const { data: locations } = await supabase
            .from('locations')
            .select('id')
            .eq('organization_id', selectedOrganization.id);

        if (locations && locations.length > 0) {
            const { data } = await supabase
                .from('classrooms')
                .select('id, name')
                .in('location_id', locations.map(l => l.id));
            if (data) setClassrooms(data);
        }
    }, [supabase, selectedOrganization]);

    const fetchGrades = useCallback(async () => {
        if (!selectedOrganization) return;
        const { data: programs } = await supabase
            .from('programs')
            .select('id')
            .eq('organization_id', selectedOrganization.id);

        if (programs && programs.length > 0) {
            const { data } = await supabase
                .from('grades')
                .select('id, name')
                .in('program_id', programs.map(p => p.id))
                .order('order');
            if (data) setGrades(data);
        }
    }, [supabase, selectedOrganization]);

    useEffect(() => {
        fetchStudents();
        fetchClassrooms();
        fetchGrades();
    }, [fetchStudents, fetchClassrooms, fetchGrades]);

    const handleEdit = (student: Student) => {
        setEditingStudent(student);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setEditingStudent(null);
        setIsFormOpen(true);
    };

    // Selection handlers
    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === students.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(students.map(s => s.id)));
        }
    };

    const clearSelection = () => {
        setSelectedIds(new Set());
        setBulkAction(null);
    };

    // Bulk action handlers
    const handleBulkMoveToClassroom = async () => {
        if (!targetClassroom) return;
        setProcessing(true);

        // Get active academic year
        const { data: academicYear } = await supabase
            .from('academic_years')
            .select('id')
            .eq('is_active', true)
            .single();

        for (const studentId of selectedIds) {
            // Check for existing enrollment (any status)
            const { data: existing } = await supabase
                .from('enrollments')
                .select('id, status')
                .eq('student_id', studentId)
                .limit(1)
                .maybeSingle();

            if (existing) {
                // Update existing enrollment
                const { error } = await supabase
                    .from('enrollments')
                    .update({ classroom_id: targetClassroom, status: 'ACTIVE' })
                    .eq('id', existing.id);
                if (error) console.error('Update enrollment error:', error);
            } else if (academicYear) {
                // Create new enrollment
                const { error } = await supabase
                    .from('enrollments')
                    .insert({
                        student_id: studentId,
                        classroom_id: targetClassroom,
                        academic_year_id: academicYear.id,
                        status: 'ACTIVE'
                    });
                if (error) console.error('Insert enrollment error:', error);
            }
        }

        setProcessing(false);
        clearSelection();
        fetchStudents();
    };

    const handleBulkChangeStatus = async () => {
        setProcessing(true);

        for (const studentId of selectedIds) {
            await supabase
                .from('enrollments')
                .update({ status: targetStatus })
                .eq('student_id', studentId)
                .eq('status', 'ACTIVE');
        }

        setProcessing(false);
        clearSelection();
        fetchStudents();
    };

    const handleBulkChangeGrade = async () => {
        if (!targetGrade) return;
        setProcessing(true);

        for (const studentId of selectedIds) {
            // First check if enrollment exists
            const { data: existing } = await supabase
                .from('enrollments')
                .select('id')
                .eq('student_id', studentId)
                .limit(1)
                .maybeSingle();

            if (existing) {
                const { error } = await supabase
                    .from('enrollments')
                    .update({ grade_id: targetGrade })
                    .eq('id', existing.id);
                if (error) console.error('Update grade error:', error);
            }
        }

        setProcessing(false);
        clearSelection();
        fetchStudents();
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} student(s)? This action cannot be undone.`)) {
            return;
        }
        setProcessing(true);

        for (const studentId of selectedIds) {
            // Delete enrollments first
            await supabase.from('enrollments').delete().eq('student_id', studentId);
            // Delete student
            await supabase.from('students').delete().eq('id', studentId);
        }

        setProcessing(false);
        clearSelection();
        fetchStudents();
    };

    const isAllSelected = students.length > 0 && selectedIds.size === students.length;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Students</h2>
                    <p className="text-gray-500 text-sm">Manage student enrollment and details.</p>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setIsImportOpen(true)}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-700 transition-colors"
                    >
                        <FileSpreadsheet size={18} /> Import CSV
                    </button>
                    <button
                        onClick={handleAdd}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={18} /> Add Student
                    </button>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 flex items-center justify-between animate-in slide-in-from-top-2">
                    <div className="flex items-center gap-3">
                        <CheckSquare className="text-indigo-600" size={20} />
                        <span className="font-semibold text-indigo-900">{selectedIds.size} student(s) selected</span>
                        <button onClick={clearSelection} className="text-indigo-600 hover:text-indigo-800 text-sm underline">
                            Clear
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        {/* Move to Classroom */}
                        {bulkAction === 'move' ? (
                            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-indigo-200">
                                <select
                                    value={targetClassroom}
                                    onChange={(e) => setTargetClassroom(e.target.value)}
                                    className="text-sm border-none focus:ring-0"
                                >
                                    <option value="">Select classroom...</option>
                                    {classrooms.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleBulkMoveToClassroom}
                                    disabled={!targetClassroom || processing}
                                    className="bg-indigo-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                                >
                                    {processing ? 'Moving...' : 'Apply'}
                                </button>
                                <button onClick={() => setBulkAction(null)} className="text-gray-400 hover:text-gray-600">
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setBulkAction('move')}
                                className="bg-white border border-indigo-200 text-indigo-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-100 transition-colors text-sm"
                            >
                                <Users size={16} /> Move to Classroom
                            </button>
                        )}

                        {/* Change Status */}
                        {bulkAction === 'status' ? (
                            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-indigo-200">
                                <select
                                    value={targetStatus}
                                    onChange={(e) => setTargetStatus(e.target.value)}
                                    className="text-sm border-none focus:ring-0"
                                >
                                    <option value="ACTIVE">Active</option>
                                    <option value="INACTIVE">Inactive</option>
                                    <option value="GRADUATED">Graduated</option>
                                    <option value="WITHDRAWN">Withdrawn</option>
                                </select>
                                <button
                                    onClick={handleBulkChangeStatus}
                                    disabled={processing}
                                    className="bg-amber-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                                >
                                    {processing ? 'Updating...' : 'Apply'}
                                </button>
                                <button onClick={() => setBulkAction(null)} className="text-gray-400 hover:text-gray-600">
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setBulkAction('status')}
                                className="bg-white border border-amber-200 text-amber-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-amber-50 transition-colors text-sm"
                            >
                                Change Status
                            </button>
                        )}

                        {/* Change Grade */}
                        {bulkAction === 'grade' ? (
                            <div className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-green-200">
                                <select
                                    value={targetGrade}
                                    onChange={(e) => setTargetGrade(e.target.value)}
                                    className="text-sm border-none focus:ring-0"
                                >
                                    <option value="">Select grade...</option>
                                    {grades.map(g => (
                                        <option key={g.id} value={g.id}>{g.name}</option>
                                    ))}
                                </select>
                                <button
                                    onClick={handleBulkChangeGrade}
                                    disabled={!targetGrade || processing}
                                    className="bg-green-600 text-white px-3 py-1 rounded text-sm disabled:opacity-50"
                                >
                                    {processing ? 'Updating...' : 'Apply'}
                                </button>
                                <button onClick={() => setBulkAction(null)} className="text-gray-400 hover:text-gray-600">
                                    <X size={16} />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setBulkAction('grade')}
                                className="bg-white border border-green-200 text-green-700 px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-50 transition-colors text-sm"
                            >
                                <GraduationCap size={16} /> Change Grade
                            </button>
                        )}

                        {/* Delete */}
                        <button
                            onClick={handleBulkDelete}
                            disabled={processing}
                            className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-red-700 transition-colors text-sm disabled:opacity-50"
                        >
                            <Trash2 size={16} /> Delete
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-4 py-4 w-12">
                                <button onClick={toggleSelectAll} className="text-gray-400 hover:text-gray-600">
                                    {isAllSelected ? <CheckSquare size={20} className="text-indigo-600" /> : <Square size={20} />}
                                </button>
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Full Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Classroom</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading students...</td></tr>
                        ) : students.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-400">No students found.</td></tr>
                        ) : (
                            students.map(student => (
                                <tr key={student.id} className={`hover:bg-gray-50 group transition-colors ${selectedIds.has(student.id) ? 'bg-indigo-50' : ''}`}>
                                    <td className="px-4 py-4">
                                        <button onClick={() => toggleSelection(student.id)} className="text-gray-400 hover:text-gray-600">
                                            {selectedIds.has(student.id) ? (
                                                <CheckSquare size={20} className="text-indigo-600" />
                                            ) : (
                                                <Square size={20} />
                                            )}
                                        </button>
                                    </td>
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

            <CsvStudentImport
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onSuccess={fetchStudents}
            />
        </div>
    );
}

