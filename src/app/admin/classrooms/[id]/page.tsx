'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useOrganization } from '@/context/OrganizationContext';
import { ArrowLeft, Save, Users, GraduationCap, UserCheck, Plus, X } from 'lucide-react';
import Link from 'next/link';

interface Grade {
    id: string;
    name: string;
    order: number;
}

interface Teacher {
    id: string;
    name: string;
    email: string;
}

interface Student {
    id: string;
    first_name: string;
    last_name: string;
}

interface Classroom {
    id: string;
    name: string;
    capacity: number;
    location_id: string;
}

export default function ClassroomDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    const supabase = createClient();
    const { selectedOrganization } = useOrganization();

    const [classroom, setClassroom] = useState<Classroom | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Form state
    const [name, setName] = useState('');
    const [capacity, setCapacity] = useState(20);

    // Grades
    const [allGrades, setAllGrades] = useState<Grade[]>([]);
    const [classroomGradeIds, setClassroomGradeIds] = useState<string[]>([]);

    // Teachers
    const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
    const [classroomTeacherIds, setClassroomTeacherIds] = useState<string[]>([]);

    // Students
    const [students, setStudents] = useState<Student[]>([]);

    const fetchClassroom = useCallback(async () => {
        if (!selectedOrganization) return;
        setLoading(true);

        // Fetch classroom details
        const { data: classroomData } = await supabase
            .from('classrooms')
            .select('*')
            .eq('id', id)
            .single();

        if (classroomData) {
            setClassroom(classroomData);
            setName(classroomData.name);
            setCapacity(classroomData.capacity);
        }

        // Fetch mapped grades
        const { data: mappedGrades } = await supabase
            .from('classroom_grades')
            .select('grade_id')
            .eq('classroom_id', id);

        if (mappedGrades) {
            setClassroomGradeIds(mappedGrades.map(g => g.grade_id));
        }

        // Fetch assigned teachers
        const { data: assignedTeachers } = await supabase
            .from('teacher_classrooms')
            .select('staff_id')
            .eq('classroom_id', id);

        if (assignedTeachers) {
            setClassroomTeacherIds(assignedTeachers.map(t => t.staff_id));
        }

        // Fetch all available grades for this organization only
        const { data: gradesData } = await supabase
            .from('grades')
            .select('*')
            .eq('organization_id', selectedOrganization.id)
            .order('order');

        if (gradesData) setAllGrades(gradesData);

        // Fetch all teachers for this organization
        const { data: teachersData } = await supabase
            .from('staff')
            .select(`
                id,
                email,
                persons!inner(first_name, last_name, organization_id)
            `)
            .eq('role', 'TEACHER')
            .eq('persons.organization_id', selectedOrganization.id);

        if (teachersData) {
            setAllTeachers(teachersData.map((t: any) => ({
                id: t.id,
                name: t.persons ? `${t.persons.first_name} ${t.persons.last_name}` : 'Unknown',
                email: t.email || ''
            })));
        }

        // Fetch enrolled students
        const { data: enrollmentsData } = await supabase
            .from('enrollments')
            .select(`
                student:students(
                    id,
                    person:persons(first_name, last_name)
                )
            `)
            .eq('classroom_id', id)
            .eq('status', 'ACTIVE');

        if (enrollmentsData) {
            const studentList = enrollmentsData
                .filter((e: any) => e.student?.person)
                .map((e: any) => ({
                    id: e.student.id,
                    first_name: e.student.person.first_name,
                    last_name: e.student.person.last_name
                }));
            setStudents(studentList);
        }

        setLoading(false);
    }, [supabase, id, selectedOrganization]);

    useEffect(() => {
        if (selectedOrganization) {
            fetchClassroom();
        }
    }, [fetchClassroom, selectedOrganization]);

    const handleSaveBasicInfo = async () => {
        setSaving(true);
        const { error } = await supabase
            .from('classrooms')
            .update({ name, capacity })
            .eq('id', id);

        if (error) {
            alert('Error: ' + error.message);
        } else {
            alert('Saved!');
        }
        setSaving(false);
    };

    const toggleGrade = async (gradeId: string) => {
        const isCurrentlyMapped = classroomGradeIds.includes(gradeId);

        if (isCurrentlyMapped) {
            // Remove
            const { error } = await supabase
                .from('classroom_grades')
                .delete()
                .eq('classroom_id', id)
                .eq('grade_id', gradeId);

            if (!error) {
                setClassroomGradeIds(prev => prev.filter(g => g !== gradeId));
            }
        } else {
            // Add
            const { error } = await supabase
                .from('classroom_grades')
                .insert({ classroom_id: id, grade_id: gradeId });

            if (!error) {
                setClassroomGradeIds(prev => [...prev, gradeId]);
            }
        }
    };

    const toggleTeacher = async (teacherId: string) => {
        const isCurrentlyAssigned = classroomTeacherIds.includes(teacherId);

        if (isCurrentlyAssigned) {
            // Remove
            const { error } = await supabase
                .from('teacher_classrooms')
                .delete()
                .eq('classroom_id', id)
                .eq('staff_id', teacherId);

            if (!error) {
                setClassroomTeacherIds(prev => prev.filter(t => t !== teacherId));
            }
        } else {
            // Add
            const { error } = await supabase
                .from('teacher_classrooms')
                .insert({ classroom_id: id, staff_id: teacherId });

            if (!error) {
                setClassroomTeacherIds(prev => [...prev, teacherId]);
            }
        }
    };

    if (!selectedOrganization) {
        return <div className="p-6 text-gray-500">Please select an organization.</div>;
    }

    if (loading) {
        return <div className="p-6 text-gray-500">Loading classroom...</div>;
    }

    if (!classroom) {
        return <div className="p-6 text-red-500">Classroom not found.</div>;
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/classrooms"
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                    <ArrowLeft size={20} className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{classroom.name}</h1>
                    <p className="text-sm text-gray-500">Manage classroom settings</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Basic Info */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <GraduationCap size={18} className="text-indigo-600" />
                        Basic Information
                    </h2>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Classroom Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                            <input
                                type="number"
                                value={capacity}
                                onChange={e => setCapacity(parseInt(e.target.value))}
                                className="w-full border border-gray-300 rounded-lg p-2 text-gray-900 focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                        <button
                            onClick={handleSaveBasicInfo}
                            disabled={saving}
                            className="w-full bg-indigo-600 text-white py-2 rounded-lg font-semibold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-colors"
                        >
                            <Save size={16} />
                            {saving ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </div>

                {/* Grades */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <GraduationCap size={18} className="text-green-600" />
                        Mapped Grades
                    </h2>
                    {allGrades.length === 0 ? (
                        <p className="text-sm text-gray-500">No grades configured for this organization.</p>
                    ) : (
                        <div className="space-y-2">
                            {allGrades.map(grade => (
                                <button
                                    key={grade.id}
                                    onClick={() => toggleGrade(grade.id)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${classroomGradeIds.includes(grade.id)
                                        ? 'border-green-500 bg-green-50 text-green-800'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                        }`}
                                >
                                    <span className="font-medium">{grade.name}</span>
                                    {classroomGradeIds.includes(grade.id) ? (
                                        <X size={16} className="text-green-600" />
                                    ) : (
                                        <Plus size={16} className="text-gray-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Teachers */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <UserCheck size={18} className="text-blue-600" />
                        Assigned Teachers
                    </h2>
                    {allTeachers.length === 0 ? (
                        <p className="text-sm text-gray-500">No teachers found for this organization.</p>
                    ) : (
                        <div className="space-y-2">
                            {allTeachers.map(teacher => (
                                <button
                                    key={teacher.id}
                                    onClick={() => toggleTeacher(teacher.id)}
                                    className={`w-full text-left p-3 rounded-lg border transition-all flex items-center justify-between ${classroomTeacherIds.includes(teacher.id)
                                        ? 'border-blue-500 bg-blue-50 text-blue-800'
                                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                                        }`}
                                >
                                    <div>
                                        <span className="font-medium">{teacher.name}</span>
                                        <span className="text-xs text-gray-500 block">{teacher.email}</span>
                                    </div>
                                    {classroomTeacherIds.includes(teacher.id) ? (
                                        <X size={16} className="text-blue-600" />
                                    ) : (
                                        <Plus size={16} className="text-gray-400" />
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Students */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Users size={18} className="text-purple-600" />
                    Enrolled Students ({students.length})
                </h2>
                {students.length === 0 ? (
                    <p className="text-sm text-gray-500">No students enrolled in this classroom.</p>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                        {students.map(student => (
                            <div
                                key={student.id}
                                className="p-3 bg-gray-50 rounded-lg border border-gray-100 text-center"
                            >
                                <div className="w-10 h-10 mx-auto bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold mb-2">
                                    {student.first_name[0]}
                                </div>
                                <p className="text-sm font-medium text-gray-900 truncate">
                                    {student.first_name} {student.last_name}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
