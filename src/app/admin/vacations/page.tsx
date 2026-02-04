'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Calendar, Plus, Search, Trash2, User } from 'lucide-react';
import VacationModal from '@/components/admin/VacationModal';

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    profile_picture?: string;
    classrooms: { name: string } | null;
}

interface Vacation {
    id: string;
    student_id: string;
    start_date: string;
    end_date: string;
    reason: string;
    students: {
        first_name: string;
        last_name: string;
    } | null;
}

export default function VacationsPage() {
    const supabase = createClient();
    const [vacations, setVacations] = useState<Vacation[]>([]);
    const [loading, setLoading] = useState(true);
    const [students, setStudents] = useState<Student[]>([]);
    const [studentSearch, setStudentSearch] = useState('');

    // Modal state
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

    const fetchVacations = useCallback(async () => {
        setLoading(true);
        // Fetch all future/current vacations
        const { data } = await supabase
            .from('student_vacations')
            .select(`
                *,
                students (first_name, last_name)
            `)
            .gte('end_date', new Date().toISOString().split('T')[0]) // Active only? Or all? Let's show all for now but ordered desc
            .order('start_date', { ascending: true });

        if (data) setVacations(data as unknown as Vacation[]);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchVacations();
    }, [fetchVacations]);

    // Search students for adding new vacation
    const searchStudents = async (query: string) => {
        if (!query) {
            setStudents([]);
            return;
        }
        const { data } = await supabase
            .from('students')
            .select('id, first_name, last_name, profile_picture, classrooms(name)')
            .ilike('first_name', `%${query}%`)
            .limit(5);

        if (data) setStudents(data as unknown as Student[]);
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setStudentSearch(val);
        searchStudents(val);
    };

    const handleSelectStudent = (student: Student) => {
        setSelectedStudent(student);
        setStudentSearch('');
        setStudents([]);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Delete this vacation record?')) return;
        await supabase.from('student_vacations').delete().eq('id', id);
        fetchVacations();
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Vacations</h2>
                    <p className="text-gray-500 text-sm">Manage student leaves and holidays.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Panel: Add Vacation / Search */}
                <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-200 p-6 h-fit">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Plus size={18} className="text-brand-olive" />
                        Add New Vacation
                    </h3>
                    <div className="relative mb-4">
                        <input
                            type="text"
                            value={studentSearch}
                            onChange={handleSearchChange}
                            placeholder="Search student name..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-gold outline-none"
                        />
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
                    </div>

                    <div className="space-y-2">
                        {students.map(s => (
                            <button
                                key={s.id}
                                onClick={() => handleSelectStudent(s)}
                                className="w-full text-left p-3 rounded-lg hover:bg-gray-50 flex items-center gap-3 transition-colors border border-transparent hover:border-gray-200"
                            >
                                <div className="h-8 w-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                                    {s.profile_picture ? (
                                        /* eslint-disable-next-line @next/next/no-img-element */
                                        <img src={s.profile_picture} alt={s.first_name} className="h-full w-full object-cover" />
                                    ) : <User size={14} />}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">{s.first_name} {s.last_name}</p>
                                    <p className="text-xs text-gray-500">{s.classrooms?.name}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Right Panel: List */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 bg-gray-50">
                        <h3 className="font-semibold text-gray-700">Upcoming & Active Vacations</h3>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {loading ? (
                            <div className="p-8 text-center text-gray-400">Loading...</div>
                        ) : vacations.length === 0 ? (
                            <div className="p-8 text-center text-gray-400">No active vacations found.</div>
                        ) : (
                            vacations.map(v => (
                                <div key={v.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-brand-cream rounded-lg text-brand-olive">
                                            <Calendar size={20} />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900">{v.students?.first_name} {v.students?.last_name}</p>
                                            <div className="flex items-center gap-2 text-sm text-gray-600">
                                                <span>{v.start_date}</span>
                                                <span className="text-gray-400">→</span>
                                                <span>{v.end_date}</span>
                                            </div>
                                            {v.reason && <p className="text-xs text-italics text-gray-400 mt-1">{v.reason}</p>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(v.id)}
                                        className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Modal for adding - reusing existing component */}
            {selectedStudent && (
                <VacationModal
                    isOpen={!!selectedStudent}
                    onClose={() => { setSelectedStudent(null); fetchVacations(); }}
                    studentId={selectedStudent.id}
                    studentName={`${selectedStudent.first_name} ${selectedStudent.last_name}`}
                />
            )}
        </div>
    );
}
