'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Users, GraduationCap } from 'lucide-react';

interface ClassroomGrade {
    grades: {
        name: string;
        type: string;
    } | null;
}

interface TeacherClassroom {
    profiles: {
        name: string;
    } | null;
}

interface Classroom {
    id: string;
    name: string;
    capacity: number;
    classroom_grades: ClassroomGrade[];
    teacher_classrooms: TeacherClassroom[];
    students: { count: number }[];
}

export default function ClassroomsPage() {
    const supabase = createClient();
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchClassrooms = async () => {
            setLoading(true);
            // Fetch classrooms with relationships
            const { data } = await supabase
                .from('classrooms')
                .select(`
                *,
                classroom_grades (
                    grades (name, type)
                ),
                teacher_classrooms (
                    profiles (name)
                ),
                students (count)
            `)
                .order('name');

            if (data) setClassrooms(data as unknown as Classroom[]);
            setLoading(false);
        };

        fetchClassrooms();
    }, [supabase]);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Classrooms</h2>
                    <p className="text-gray-500 text-sm">Overview of class structures and assignments.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full py-20 text-center text-gray-400">Loading classrooms...</div>
                ) : classrooms.map(cls => (
                    <div key={cls.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
                                <p className="text-sm text-gray-500">Capacity: {cls.capacity}</p>
                            </div>
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <GraduationCap size={20} />
                            </div>
                        </div>

                        <div className="space-y-4 flex-1">
                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Grades</p>
                                <div className="flex flex-wrap gap-2">
                                    {cls.classroom_grades?.map((cg, i) => (
                                        <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border border-gray-200">
                                            {cg.grades?.name}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Assigned Teachers</p>
                                <div className="space-y-1">
                                    {cls.teacher_classrooms?.length > 0 ? cls.teacher_classrooms.map((tc, i) => (
                                        <div key={i} className="text-sm text-gray-700 flex items-center gap-2">
                                            <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                            {tc.profiles?.name}
                                        </div>
                                    )) : (
                                        <p className="text-sm text-gray-400 italic">No teachers assigned</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                                <Users size={16} />
                                <span>{cls.students?.[0]?.count || 0} Students Enrolled</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
