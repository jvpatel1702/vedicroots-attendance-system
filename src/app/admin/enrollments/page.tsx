/**
 * Enrollments Management Page (Admin)
 * ------------------------------------
 * View and manage all enrollments filtered by academic year.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useOrganization } from '@/context/OrganizationContext';
import { Calendar, Users, Trash2, Edit, BookOpen, UserPlus, Eye } from 'lucide-react';
import Link from 'next/link';
import AddEnrollmentModal from '@/components/admin/AddEnrollmentModal';

interface AcademicYear {
    id: string;
    name: string;
    is_active: boolean;
}

interface Enrollment {
    id: string;
    status: string;
    student: {
        id: string;
        student_number: string;
        person: {
            first_name: string;
            last_name: string;
        };
    };
    classroom: {
        id: string;
        name: string;
    } | null;
    grade: {
        id: string;
        name: string;
    } | null;
    start_date: string;
    end_date: string | null;
}

interface Classroom {
    id: string;
    name: string;
}

interface Grade {
    id: string;
    name: string;
}

export default function EnrollmentsPage() {
    const supabase = createClient();
    const { selectedOrganization } = useOrganization();

    const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
    const [selectedYear, setSelectedYear] = useState<string>('');
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Editing state
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState({
        classroom_id: '',
        grade_id: '',
        status: '',
        start_date: '',
        end_date: ''
    });

    // Fetch academic years
    const fetchAcademicYears = useCallback(async () => {
        const { data } = await supabase
            .from('academic_years')
            .select('id, name, is_active')
            .order('start_date', { ascending: false });

        if (data) {
            setAcademicYears(data);
            // Select active year by default
            const activeYear = data.find(y => y.is_active);
            if (activeYear) setSelectedYear(activeYear.id);
            else if (data.length > 0) setSelectedYear(data[0].id);
        }
    }, [supabase]);

    // Fetch classrooms and grades for the org
    const fetchLookupData = useCallback(async () => {
        if (!selectedOrganization) return;

        // Get locations for org
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

        // Fetch grades directly by organization_id
        const { data: gradeData } = await supabase
            .from('grades')
            .select('id, name')
            .eq('organization_id', selectedOrganization.id)
            .order('order');
        if (gradeData) setGrades(gradeData);
    }, [supabase, selectedOrganization]);

    // Fetch enrollments for selected year
    const fetchEnrollments = useCallback(async () => {
        if (!selectedYear) return;
        setLoading(true);


        // Fetching enrollments with start_date and end_date
        const { data, error } = await supabase
            .from('enrollments')
            .select(`
                id,
                status,
                student:students!student_id (
                    id,
                    student_number,
                    person:persons!person_id (
                        first_name,
                        last_name
                    )
                ),
                classroom:classrooms!classroom_id (
                    id,
                    name
                ),

                grade:grades!grade_id (
                    id,
                    name
                ),
                start_date,
                end_date
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching enrollments:', JSON.stringify(error, null, 2));
            console.error('Error details:', error.message, error.details, error.hint);
        }

        if (data) {
            // Filter out any enrollments with null students
            const validEnrollments = (data as unknown as Enrollment[]).filter(e => e.student);
            setEnrollments(validEnrollments);
        }
        setLoading(false);
    }, [supabase, selectedYear]);

    useEffect(() => {
        fetchAcademicYears();
        fetchLookupData();
    }, [fetchAcademicYears, fetchLookupData]);

    useEffect(() => {
        if (selectedYear) {
            fetchEnrollments();
        }
    }, [selectedYear, fetchEnrollments]);

    const handleEdit = (enrollment: Enrollment) => {
        setEditingId(enrollment.id);
        setEditForm({
            classroom_id: enrollment.classroom?.id || '',
            grade_id: enrollment.grade?.id || '',
            status: enrollment.status,
            start_date: enrollment.start_date,
            end_date: enrollment.end_date || ''
        });
    };

    const handleSaveEdit = async () => {
        if (!editingId) return;

        const { error } = await supabase
            .from('enrollments')
            .update({
                classroom_id: editForm.classroom_id || null,
                grade_id: editForm.grade_id || null,
                status: editForm.status,
                start_date: editForm.start_date,
                end_date: editForm.end_date || null
            })
            .eq('id', editingId);

        if (error) {
            alert('Error updating enrollment: ' + error.message);
        } else {
            setEditingId(null);
            fetchEnrollments();
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this enrollment?')) return;

        const { error } = await supabase
            .from('enrollments')
            .delete()
            .eq('id', id);

        if (error) {
            alert('Error deleting enrollment: ' + error.message);
        } else {
            fetchEnrollments();
        }
    };

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            'ACTIVE': 'bg-green-100 text-green-700',
            'INACTIVE': 'bg-gray-100 text-gray-600',
            'GRADUATED': 'bg-blue-100 text-blue-700',
            'WITHDRAWN': 'bg-red-100 text-red-700'
        };
        return styles[status] || 'bg-gray-100 text-gray-600';
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Enrollments</h2>
                    <p className="text-gray-500 text-sm">Manage student enrollments by academic year.</p>
                </div>

                {/* Academic Year Selector & Action */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-3 bg-white border border-gray-200 rounded-xl px-4 py-2">
                        <Calendar size={20} className="text-indigo-600" />
                        <span className="text-sm text-gray-500">Academic Year:</span>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="font-semibold text-gray-900 border-none focus:ring-0 bg-transparent cursor-pointer outline-none"
                        >
                            {academicYears.map(year => (
                                <option key={year.id} value={year.id}>
                                    {year.name} {year.is_active && '(Active)'}
                                </option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        disabled={!selectedYear}
                        className="flex items-center gap-2 bg-brand-olive text-white px-4 py-2 rounded-xl hover:bg-opacity-90 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                    >
                        <UserPlus size={18} />
                        Add Enrollment
                    </button>
                </div>
            </div>

            {/* Modals */}
            {selectedYear && (
                <AddEnrollmentModal
                    isOpen={isAddModalOpen}
                    onClose={() => setIsAddModalOpen(false)}
                    onSuccess={fetchEnrollments}
                    academicYearId={selectedYear}
                    academicYearName={academicYears.find(y => y.id === selectedYear)?.name || ''}
                />
            )}

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-indigo-100 p-2.5 rounded-lg">
                            <Users size={20} className="text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{enrollments.length}</p>
                            <p className="text-xs text-gray-500">Total Enrollments</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2.5 rounded-lg">
                            <BookOpen size={20} className="text-green-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {enrollments.filter(e => e.status === 'ACTIVE').length}
                            </p>
                            <p className="text-xs text-gray-500">Active</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2.5 rounded-lg">
                            <BookOpen size={20} className="text-blue-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {enrollments.filter(e => e.status === 'GRADUATED').length}
                            </p>
                            <p className="text-xs text-gray-500">Graduated</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="bg-gray-100 p-2.5 rounded-lg">
                            <BookOpen size={20} className="text-gray-600" />
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">
                                {enrollments.filter(e => e.status === 'INACTIVE' || e.status === 'WITHDRAWN').length}
                            </p>
                            <p className="text-xs text-gray-500">Inactive/Withdrawn</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Enrollments Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Student</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Classroom</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Grade</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Dates</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading enrollments...</td></tr>
                        ) : enrollments.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-400">No enrollments found for this academic year.</td></tr>
                        ) : (
                            enrollments.map(enrollment => (
                                <tr key={enrollment.id} className="hover:bg-gray-50 group transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-600 font-bold border border-indigo-100">
                                                {enrollment.student.person?.first_name?.[0] || '?'}
                                            </div>
                                            <div>
                                                <Link href={`/admin/students/${enrollment.student.id}`} className="font-semibold text-gray-900 hover:text-indigo-600 hover:underline">
                                                    {enrollment.student.person?.first_name} {enrollment.student.person?.last_name}
                                                </Link>
                                                <p className="text-xs text-gray-400">ID: {enrollment.student.student_number}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === enrollment.id ? (
                                            <select
                                                value={editForm.classroom_id}
                                                onChange={(e) => setEditForm({ ...editForm, classroom_id: e.target.value })}
                                                className="border rounded px-2 py-1 text-sm"
                                            >
                                                <option value="">Unassigned</option>
                                                {classrooms.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="text-sm text-gray-600">
                                                {enrollment.classroom?.name || 'Unassigned'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === enrollment.id ? (
                                            <select
                                                value={editForm.grade_id}
                                                onChange={(e) => setEditForm({ ...editForm, grade_id: e.target.value })}
                                                className="border rounded px-2 py-1 text-sm"
                                            >
                                                <option value="">N/A</option>
                                                {grades.map(g => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                                                {enrollment.grade?.name || 'N/A'}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === enrollment.id ? (
                                            <div className="flex flex-col gap-2">
                                                <div className="text-xs">
                                                    <span className="text-gray-500 block mb-1">Start:</span>
                                                    <input
                                                        type="date"
                                                        value={editForm.start_date}
                                                        onChange={(e) => setEditForm({ ...editForm, start_date: e.target.value })}
                                                        className="border rounded px-2 py-1 text-xs w-full"
                                                        required
                                                    />
                                                </div>
                                                <div className="text-xs">
                                                    <span className="text-gray-500 block mb-1">End:</span>
                                                    <input
                                                        type="date"
                                                        value={editForm.end_date}
                                                        onChange={(e) => setEditForm({ ...editForm, end_date: e.target.value })}
                                                        className="border rounded px-2 py-1 text-xs w-full"
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-sm text-gray-600">
                                                <div><span className="text-xs text-gray-400">Start:</span> {enrollment.start_date}</div>
                                                {enrollment.end_date && (
                                                    <div><span className="text-xs text-gray-400">End:</span> {enrollment.end_date}</div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4">
                                        {editingId === enrollment.id ? (
                                            <select
                                                value={editForm.status}
                                                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                                className="border rounded px-2 py-1 text-sm"
                                            >
                                                <option value="ACTIVE">Active</option>
                                                <option value="INACTIVE">Inactive</option>
                                                <option value="GRADUATED">Graduated</option>
                                                <option value="WITHDRAWN">Withdrawn</option>
                                            </select>
                                        ) : (
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusBadge(enrollment.status)}`}>
                                                {enrollment.status}
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {editingId === enrollment.id ? (
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={handleSaveEdit}
                                                    className="px-3 py-1 bg-indigo-600 text-white rounded text-sm hover:bg-indigo-700"
                                                >
                                                    Save
                                                </button>
                                                <button
                                                    onClick={() => setEditingId(null)}
                                                    className="px-3 py-1 text-gray-500 hover:text-gray-700 text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Link
                                                    href={`/admin/enrollments/${enrollment.id}`}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                                    title="View Details"
                                                >
                                                    <Eye size={18} />
                                                </Link>
                                                <button
                                                    onClick={() => handleEdit(enrollment)}
                                                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                                    title="Edit"
                                                >
                                                    <Edit size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(enrollment.id)}
                                                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
