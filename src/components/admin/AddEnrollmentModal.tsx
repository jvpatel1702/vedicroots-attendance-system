'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { X, Search, Check, Users, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOrganization } from '@/context/OrganizationContext';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    academicYearId: string;
    academicYearName: string;
}

interface Student {
    id: string;
    first_name: string;
    last_name: string;
    student_number: string;
    photo_url?: string;
}

interface Classroom {
    id: string;
    name: string;
    location_id: string;
}

interface Grade {
    id: string;
    name: string;
}

interface Location {
    id: string;
    name: string;
}

export default function AddEnrollmentModal({ isOpen, onClose, onSuccess, academicYearId, academicYearName }: Props) {
    const supabase = createClient();
    const { selectedOrganization } = useOrganization();

    const [activeTab, setActiveTab] = useState<'single' | 'bulk'>('single');
    const [loading, setLoading] = useState(false);

    // Data State
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [grades, setGrades] = useState<Grade[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);

    // Single Enroll State
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState<Student[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [singleLocationId, setSingleLocationId] = useState('');
    const [singleClassroomId, setSingleClassroomId] = useState('');
    const [singleGradeId, setSingleGradeId] = useState('');

    // Bulk Enroll State
    const [unenrolledStudents, setUnenrolledStudents] = useState<Student[]>([]);
    const [selectedBulkIds, setSelectedBulkIds] = useState<Set<string>>(new Set());
    const [bulkLocationId, setBulkLocationId] = useState('');
    const [bulkClassroomId, setBulkClassroomId] = useState('');
    const [bulkGradeId, setBulkGradeId] = useState('');

    // Fetch initial data
    useEffect(() => {
        if (!isOpen) return;

        const fetchData = async () => {
            if (!selectedOrganization) return;

            // Fetch Grades filtered by org
            const { data: gradeData } = await supabase
                .from('grades')
                .select('id, name')
                .eq('organization_id', selectedOrganization.id)
                .order('order');

            const { data: locData } = await supabase
                .from('locations')
                .select('id, name')
                .eq('organization_id', selectedOrganization.id)
                .order('name');

            if (gradeData) setGrades(gradeData);
            if (locData) setLocations(locData);
        };
        fetchData();
    }, [isOpen, selectedOrganization, supabase]);

    // Fetch Classrooms when Location changes
    useEffect(() => {
        const fetchClassrooms = async (locId: string) => {
            if (!locId) {
                setClassrooms([]);
                return;
            }
            const { data } = await supabase
                .from('classrooms')
                .select('id, name, location_id')
                .eq('location_id', locId)
                .order('name');
            if (data) setClassrooms(data);
        };

        if (activeTab === 'single') fetchClassrooms(singleLocationId);
        else fetchClassrooms(bulkLocationId);
    }, [singleLocationId, bulkLocationId, activeTab, supabase]);

    // Search Students (Single Tab)
    useEffect(() => {
        const searchStudents = async () => {
            if (searchTerm.length < 2) {
                setSearchResults([]);
                return;
            }

            // Find students matching name, who are NOT enrolled in this year
            // Note: This query logic is tricky in Supabase plain client.
            // Simpler approach: Find matches, then filter client-side or use a RPC if performance needed.
            // For now: Fetch matches -> Check enrollment.

            const { data } = await supabase
                .from('students')
                .select(`
                    id, student_number,
                    person:persons!inner(first_name, last_name, photo_url, organization_id)
                `)
                .eq('person.organization_id', selectedOrganization?.id)
                .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`, { foreignTable: 'person' })
                .limit(10);

            if (data) {
                // Determine which are already enrolled for this year
                const studentIds = data.map(s => s.id);
                const { data: existingEnrollments } = await supabase
                    .from('enrollments')
                    .select('student_id')
                    .eq('academic_year_id', academicYearId)
                    .in('student_id', studentIds);

                const enrolledSet = new Set(existingEnrollments?.map(e => e.student_id));

                const available = (data as any[])
                    .filter(s => s.person && !enrolledSet.has(s.id))
                    .map(s => ({
                        id: s.id,
                        first_name: s.person.first_name,
                        last_name: s.person.last_name,
                        student_number: s.student_number,
                        photo_url: s.person.photo_url
                    }));
                setSearchResults(available);
            }
        };

        const timer = setTimeout(searchStudents, 300);
        return () => clearTimeout(timer);
    }, [searchTerm, academicYearId, selectedOrganization, supabase]);

    // Fetch Unenrolled Students (Bulk Tab)
    useEffect(() => {
        if (activeTab !== 'bulk' || !isOpen || !selectedOrganization) return;

        const fetchUnenrolled = async () => {
            setLoading(true);
            // 1. Fetch ALL active students for org
            // 2. Fetch ALL enrollments for year
            // 3. Diff
            // Limit to 500 for performance?

            const { data: allStudents } = await supabase
                .from('students')
                .select(`
                    id, student_number,
                    person:persons!inner(first_name, last_name, photo_url, organization_id)
                `)
                .eq('person.organization_id', selectedOrganization.id);

            if (!allStudents) { setLoading(false); return; }

            const { data: enrolled } = await supabase
                .from('enrollments')
                .select('student_id')
                .eq('academic_year_id', academicYearId);

            const enrolledSet = new Set(enrolled?.map(e => e.student_id));

            const available = (allStudents as any[])
                .filter(s => s.person && !enrolledSet.has(s.id))
                .map(s => ({
                    id: s.id,
                    first_name: s.person.first_name,
                    last_name: s.person.last_name,
                    student_number: s.student_number,
                    photo_url: s.person.photo_url
                }))
                .sort((a, b) => a.first_name.localeCompare(b.first_name));

            setUnenrolledStudents(available);
            setLoading(false);
        };
        fetchUnenrolled();
    }, [activeTab, isOpen, academicYearId, selectedOrganization, supabase]);

    const handleSingleSubmit = async () => {
        if (!selectedStudent || !singleGradeId || !singleClassroomId) return;
        setLoading(true);

        const { error } = await supabase.from('enrollments').insert({
            student_id: selectedStudent.id,
            grade_id: singleGradeId,
            classroom_id: singleClassroomId,
            academic_year_id: academicYearId,
            status: 'ACTIVE'
        });

        if (error) {
            alert('Error enrolling student: ' + error.message);
        } else {
            onSuccess();
            handleClose();
        }
        setLoading(false);
    };

    const handleBulkSubmit = async () => {
        if (selectedBulkIds.size === 0 || !bulkGradeId || !bulkClassroomId) return;
        setLoading(true);

        const enrollments = Array.from(selectedBulkIds).map(studentId => ({
            student_id: studentId,
            grade_id: bulkGradeId,
            classroom_id: bulkClassroomId,
            academic_year_id: academicYearId,
            status: 'ACTIVE'
        }));

        const { error } = await supabase.from('enrollments').insert(enrollments);

        if (error) {
            alert('Error enrolling students: ' + error.message);
        } else {
            onSuccess();
            handleClose();
        }
        setLoading(false);
    };

    const handleClose = () => {
        setSearchTerm('');
        setSelectedStudent(null);
        setSelectedBulkIds(new Set());
        setSingleClassroomId('');
        setSingleGradeId('');
        setSingleLocationId('');
        setBulkClassroomId('');
        setBulkGradeId('');
        setBulkLocationId('');
        onClose();
    };

    const filteredUnenrolled = useMemo(() => {
        // Simple client-side search for the bulk list
        if (!searchTerm) return unenrolledStudents;
        const lower = searchTerm.toLowerCase();
        return unenrolledStudents.filter(s =>
            s.first_name.toLowerCase().includes(lower) ||
            s.last_name.toLowerCase().includes(lower) ||
            s.student_number?.toLowerCase().includes(lower)
        );
    }, [unenrolledStudents, searchTerm]);

    const toggleBulkSelection = (id: string) => {
        const newSet = new Set(selectedBulkIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedBulkIds(newSet);
    };

    const toggleAllBulk = () => {
        if (selectedBulkIds.size === filteredUnenrolled.length) {
            setSelectedBulkIds(new Set());
        } else {
            setSelectedBulkIds(new Set(filteredUnenrolled.map(s => s.id)));
        }
    };

    const filteredClassrooms = useMemo(() => {
        if (activeTab === 'single') {
            return classrooms.filter(c => c.location_id === singleLocationId);
        }
        return classrooms.filter(c => c.location_id === bulkLocationId);
    }, [classrooms, activeTab, singleLocationId, bulkLocationId]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-full max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* 1. Header (Fixed) */}
                <div className="p-5 flex justify-between items-center bg-white shrink-0 z-20 relative">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Add Enrollment</h3>
                        <p className="text-sm text-gray-500 mt-1">Academic Year: <span className="font-medium text-brand-dark">{academicYearName}</span></p>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* 2. Tabs (Fixed) */}
                <div className="flex border-b border-gray-100 bg-white shrink-0 z-20 relative">
                    <button
                        onClick={() => setActiveTab('single')}
                        className={cn("flex-1 py-3 text-sm font-semibold border-b-2 transition-all",
                            activeTab === 'single' ? "border-brand-olive text-brand-olive bg-brand-cream/10" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50")}
                    >
                        Single Student
                    </button>
                    <button
                        onClick={() => setActiveTab('bulk')}
                        className={cn("flex-1 py-3 text-sm font-semibold border-b-2 transition-all",
                            activeTab === 'bulk' ? "border-brand-olive text-brand-olive bg-brand-cream/10" : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50")}
                    >
                        Bulk Enrollment
                    </button>
                </div>

                {/* 3. Scrollable Content Body (Flex-1) */}
                <div className="flex-1 min-h-0 overflow-hidden relative bg-white">
                    {activeTab === 'single' ? (
                        <div className="flex flex-col h-full">
                            {/* Search (Fixed within tab) */}
                            <div className="p-6 pb-2 shrink-0 z-10 bg-white">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Search Student</label>
                                <div className="relative">
                                    <Search className="absolute left-3.5 top-3 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : searchTerm}
                                        onChange={(e) => {
                                            setSearchTerm(e.target.value);
                                            setSelectedStudent(null);
                                        }}
                                        placeholder="Start typing student name..."
                                        className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-olive/20 focus:border-brand-olive outline-none transition-all shadow-sm"
                                    />
                                    {selectedStudent && (
                                        <button
                                            onClick={() => { setSelectedStudent(null); setSearchTerm(''); }}
                                            className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                                        >
                                            <X size={16} />
                                        </button>
                                    )}

                                    {/* Dropdown Results */}
                                    {!selectedStudent && searchResults.length > 0 && (
                                        <div className="absolute z-50 w-full bg-white border border-gray-100 mt-2 rounded-xl shadow-xl max-h-60 overflow-y-auto overflow-x-hidden ring-1 ring-black/5">
                                            {searchResults.map(s => (
                                                <div
                                                    key={s.id}
                                                    onClick={() => setSelectedStudent(s)}
                                                    className="p-3.5 hover:bg-brand-cream/20 cursor-pointer flex items-center justify-between group transition-colors border-b last:border-0 border-gray-50"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-brand-olive/10 flex items-center justify-center text-brand-olive font-bold text-xs">
                                                            {s.first_name[0]}{s.last_name[0]}
                                                        </div>
                                                        <div>
                                                            <p className="font-semibold text-gray-800 text-sm group-hover:text-brand-dark">{s.first_name} {s.last_name}</p>
                                                            <p className="text-xs text-gray-500">ID: {s.student_number || 'N/A'}</p>
                                                        </div>
                                                    </div>
                                                    <UserPlus size={16} className="text-gray-300 group-hover:text-brand-olive transition-colors" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Form Fields (Scrollable) */}
                            <div className="flex-1 overflow-y-auto p-6 pt-4 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Location</label>
                                        <div className="relative">
                                            <select
                                                value={singleLocationId}
                                                onChange={(e) => setSingleLocationId(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-olive outline-none appearance-none bg-white"
                                            >
                                                <option value="">Select Location</option>
                                                {locations.map(loc => (
                                                    <option key={loc.id} value={loc.id}>{loc.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Select Grade</label>
                                        <div className="relative">
                                            <select
                                                value={singleGradeId}
                                                onChange={(e) => setSingleGradeId(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-olive outline-none appearance-none bg-white"
                                            >
                                                <option value="">Select Grade</option>
                                                {grades.map(g => (
                                                    <option key={g.id} value={g.id}>{g.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Classroom</label>
                                    <div className="relative">
                                        <select
                                            value={singleClassroomId}
                                            onChange={(e) => setSingleClassroomId(e.target.value)}
                                            disabled={!singleLocationId}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-olive outline-none appearance-none bg-white disabled:bg-gray-100 disabled:text-gray-400"
                                        >
                                            <option value="">Select Classroom</option>
                                            {filteredClassrooms.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col h-full">
                            {/* Filters (Fixed within tab) */}
                            <div className="p-6 pb-2 shrink-0 z-10 bg-white border-b border-gray-50">
                                <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-4 flex gap-3 items-center">
                                    <div className="bg-blue-100 p-2 rounded-full text-blue-600">
                                        <Users size={18} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-blue-900 text-sm">Bulk Enrollment Mode</h4>
                                        <p className="text-xs text-blue-800">
                                            Select students to enroll in <span className="font-bold">{academicYearName}</span>.
                                        </p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Location</label>
                                        <select
                                            value={bulkLocationId}
                                            onChange={(e) => setBulkLocationId(e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-olive outline-none"
                                        >
                                            <option value="">Select...</option>
                                            {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Grade</label>
                                        <select
                                            value={bulkGradeId}
                                            onChange={(e) => setBulkGradeId(e.target.value)}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-olive outline-none"
                                        >
                                            <option value="">Select...</option>
                                            {grades.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Classroom</label>
                                        <select
                                            value={bulkClassroomId}
                                            onChange={(e) => setBulkClassroomId(e.target.value)}
                                            disabled={!bulkLocationId}
                                            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md focus:ring-1 focus:ring-brand-olive outline-none disabled:bg-gray-100"
                                        >
                                            <option value="">Select...</option>
                                            {filteredClassrooms.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Scrollable Student List */}
                            <div className="flex-1 overflow-y-auto min-h-0 bg-gray-50/50 p-6">
                                <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                                    <div className="bg-gray-50 p-3 border-b border-gray-200 flex justify-between items-center sticky top-0 z-10">
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="checkbox"
                                                checked={selectedBulkIds.size > 0 && selectedBulkIds.size === filteredUnenrolled.length}
                                                onChange={toggleAllBulk}
                                                className="rounded text-brand-olive focus:ring-brand-olive"
                                            />
                                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Unenrolled Students</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="text"
                                                placeholder="Filter list..."
                                                value={searchTerm}
                                                onChange={e => setSearchTerm(e.target.value)}
                                                className="text-xs px-2 py-1 border rounded bg-white w-32 outline-none focus:border-brand-olive"
                                            />
                                            <span className="text-xs font-medium text-gray-600">{selectedBulkIds.size} selected</span>
                                        </div>
                                    </div>

                                    <div className="divide-y divide-gray-100 max-h-[400px] overflow-y-auto">
                                        {loading ? (
                                            <p className="p-8 text-center text-gray-400 text-sm">Loading students...</p>
                                        ) : filteredUnenrolled.length === 0 ? (
                                            <p className="p-8 text-center text-gray-400 text-sm">No unenrolled students found matching filter.</p>
                                        ) : (
                                            filteredUnenrolled.map(s => (
                                                <label key={s.id} className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer transition-colors block select-none">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedBulkIds.has(s.id)}
                                                        onChange={() => toggleBulkSelection(s.id)}
                                                        className="rounded text-brand-olive focus:ring-brand-olive mt-0.5"
                                                    />
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-gray-900 text-sm truncate">{s.first_name} {s.last_name}</p>
                                                        <p className="text-xs text-gray-500 truncate">{s.student_number || 'No ID'}</p>
                                                    </div>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* 4. Footer (Fixed) */}
                <div className="p-5 border-t border-gray-100 bg-gray-50 flex justify-end gap-3 shrink-0 rounded-b-2xl">
                    <button
                        onClick={handleClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    {activeTab === 'single' ? (
                        <button
                            onClick={handleSingleSubmit}
                            disabled={!selectedStudent || !singleClassroomId || loading}
                            className="px-6 py-2 bg-brand-olive text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
                        >
                            {loading ? 'Enrolling...' : 'Enroll Student'}
                        </button>
                    ) : (
                        <button
                            onClick={handleBulkSubmit}
                            disabled={selectedBulkIds.size === 0 || !bulkClassroomId || loading}
                            className="px-6 py-2 bg-brand-olive text-white rounded-lg hover:bg-opacity-90 transition-all font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg active:scale-95"
                        >
                            {loading ? 'Processing...' : `Enroll ${selectedBulkIds.size} Students`}
                        </button>
                    )}
                </div>

            </div>
        </div>
    );

}
