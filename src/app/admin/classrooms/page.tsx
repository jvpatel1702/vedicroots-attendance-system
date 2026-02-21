'use client';

/**
 * Classrooms Management Page
 * --------------------------
 * Displays classroom cards for the selected organization.
 *
 * Data flow:
 *  - `useClassrooms(orgId)` — TanStack Query hook that fetches classrooms
 *    from Supabase via the locations → classrooms join, scoped to the
 *    current organization. Returns rich data including assigned grades,
 *    teachers, and an enrollment count.
 *  - `queryClient.invalidateQueries` — called by `ClassroomModal.onSuccess`
 *    to clear the stale cache and trigger an automatic refetch after a
 *    create or update operation.
 *
 * Why useClassrooms instead of direct fetch?
 *  - Caching: switching tabs doesn't re-fetch if data is fresh (5 min staleTime).
 *  - Deduplication: parallel renders share the same request.
 *  - Background refetch: if the user leaves and returns, data refreshes silently.
 */

import { useState } from 'react';
import { Users, GraduationCap, Plus, ExternalLink } from 'lucide-react';
import ClassroomModal from '@/components/admin/ClassroomModal';
import { useOrganization } from '@/context/OrganizationContext';
import Link from 'next/link';
import { useClassrooms } from '@/lib/queries';
import { useQueryClient } from '@tanstack/react-query';

// ── Type Definitions ────────────────────────────────────────────────────────
// These mirror the Supabase response shape returned by useClassrooms.

interface ClassroomGrade {
    grades: { name: string } | null;
}

interface TeacherClassroom {
    staff: {
        persons: { first_name: string; last_name: string } | null;
    } | null;
}

interface Classroom {
    id: string;
    name: string;
    capacity: number;
    classroom_grades: ClassroomGrade[];
    teacher_classrooms: TeacherClassroom[];
    /** Supabase returns count as an array with one object: [{ count: number }] */
    enrollments: { count: number }[];
}

// ── Component ───────────────────────────────────────────────────────────────

export default function ClassroomsPage() {
    const { selectedOrganization } = useOrganization();
    const queryClient = useQueryClient();

    // Local UI state — not data fetching state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(null);

    // ── TanStack Query ──────────────────────────────────────────────────────
    // `enabled: !!orgId` inside the hook prevents the query from running
    // until the org context has loaded.
    const { data: classrooms = [], isLoading } = useClassrooms(selectedOrganization?.id);

    // ── Handlers ────────────────────────────────────────────────────────────

    /** Opens the modal to create a new classroom */
    const handleAdd = () => {
        setSelectedClassroom(null);
        setIsModalOpen(true);
    };

    /** Opens the modal pre-populated with the given classroom's data */
    const handleEdit = (cls: Classroom) => {
        setSelectedClassroom(cls);
        setIsModalOpen(true);
    };

    /**
     * Called by ClassroomModal after a successful save.
     * Invalidates the cache key so TanStack Query automatically refetches
     * the classroom list in the background — no manual state management needed.
     */
    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['classrooms', selectedOrganization?.id] });
    };

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* ── Page Header ───────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Classrooms</h2>
                    <p className="text-gray-500 text-sm">Overview of class structures and assignments.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={18} /> Add Classroom
                </button>
            </div>

            {/* ── Classroom Cards Grid ───────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    <div className="col-span-full py-20 text-center text-gray-400">Loading classrooms...</div>
                ) : (classrooms as Classroom[]).length === 0 ? (
                    <div className="col-span-full py-20 text-center text-gray-400">No classrooms found. Add one to get started.</div>
                ) : (
                    (classrooms as Classroom[]).map(cls => (
                        <Link
                            key={cls.id}
                            href={`/admin/classrooms/${cls.id}`}
                            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col h-full group relative hover:border-indigo-300 hover:shadow-md transition-all cursor-pointer"
                        >
                            {/* External link icon appears on hover */}
                            <div className="absolute top-4 right-4 text-gray-300 group-hover:text-indigo-500 opacity-0 group-hover:opacity-100 transition-all p-1">
                                <ExternalLink size={16} />
                            </div>

                            {/* ── Card Header: Name + Capacity ──────────────── */}
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
                                    <p className="text-sm text-gray-500">Capacity: {cls.capacity}</p>
                                </div>
                                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                    <GraduationCap size={20} />
                                </div>
                            </div>

                            {/* ── Card Body: Grades + Teachers ──────────────── */}
                            <div className="space-y-4 flex-1">
                                {/* Grade badges */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Grades</p>
                                    <div className="flex flex-wrap gap-2">
                                        {cls.classroom_grades?.length > 0
                                            ? cls.classroom_grades.map((cg, i) => (
                                                <span key={i} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs border border-gray-200">
                                                    {cg.grades?.name}
                                                </span>
                                            ))
                                            : <span className="text-xs text-gray-400 italic">No grades mapped</span>
                                        }
                                    </div>
                                </div>

                                {/* Assigned teachers list */}
                                <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Assigned Teachers</p>
                                    <div className="space-y-1">
                                        {cls.teacher_classrooms?.length > 0
                                            ? cls.teacher_classrooms.map((tc, i) => (
                                                <div key={i} className="text-sm text-gray-700 flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                                                    {tc.staff?.persons
                                                        ? `${tc.staff.persons.first_name} ${tc.staff.persons.last_name}`
                                                        : 'Unknown'}
                                                </div>
                                            ))
                                            : <p className="text-sm text-gray-400 italic">No teachers assigned</p>
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* ── Card Footer: Enrollment Count ─────────────── */}
                            <div className="pt-4 mt-4 border-t border-gray-100 flex items-center justify-between text-sm text-gray-600">
                                <div className="flex items-center gap-2">
                                    <Users size={16} />
                                    {/* enrollments is returned as [{ count }] from Supabase aggregate */}
                                    <span>{cls.enrollments?.[0]?.count || 0} Students Enrolled</span>
                                </div>
                            </div>
                        </Link>
                    ))
                )}
            </div>

            {/* ── Classroom Create/Edit Modal ────────────────────────────────── */}
            <ClassroomModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                classroom={selectedClassroom}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
