/**
 * Students Index Page (Admin)
 * ---------------------------
 * Displays the full student roster filtered by academic year.
 *
 * Data flow:
 *  - `useAcademicYears()` — fetches academic years for the year-filter dropdown.
 *  - `useStudents(orgId, selectedYear)` — fetches students for a specific org+year.
 *    Includes gender (for row coloring), dob (for age), and guardian contact info.
 *
 * Row coloring:
 *  - Male   → subtle blue  (bg-blue-50)
 *  - Female → subtle rose  (bg-rose-50)
 *  - Other/unset → neutral white
 *
 * Email / Phone:
 *  - Pulled from the student's primary guardian first.
 *  - Falls back to the first available guardian if none is marked primary.
 *  - Displays "-" when no guardian contact exists.
 */
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Plus } from 'lucide-react';

import StudentForm from '@/components/admin/StudentForm';
import VacationModal from '@/components/admin/VacationModal';
import CsvStudentImport from '@/components/admin/CsvStudentImport';
import { useOrganization } from '@/context/OrganizationContext';
import { useStudents, useAcademicYears } from '@/lib/queries';
import { useQueryClient } from '@tanstack/react-query';

// ── Type Definitions ─────────────────────────────────────────────────────────

interface GuardianContact {
    is_primary?: boolean;
    guardians: {
        email?: string | null;
        phone?: string | null;
    } | null;
}

interface Student {
    id: string;
    student_number: string;
    gender?: string | null;
    dob?: string | null;          // from students table (legacy column)
    person: {
        first_name: string;
        last_name: string;
        dob?: string | null;      // from persons table (new column)
        photo_url?: string | null;
    };
    medical?: {
        allergies: string;
        medical_conditions: string;
        medications: string;
        doctor_name: string;
        doctor_phone: string;
    };
    student_guardians?: GuardianContact[];
    enrollments?: {
        classrooms: { id: string; name: string } | null;
        grades: { id: string; name: string; order?: number } | null;
        classroom_id: string;
        grade_id: string;
        academic_year_id: string;
        status: string;
    }[];
}

interface AcademicYear { id: string; name: string; is_active: boolean; }

// ── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Calculates age from a date-of-birth string and returns a formatted string
 * like "4Y 2M". Under 1 year, returns just "8M".
 * Returns null when dob is not available.
 */
function getAge(dob: string | null | undefined): string | null {
    if (!dob) return null;
    const birth = new Date(dob);
    const today = new Date();

    let years = today.getFullYear() - birth.getFullYear();
    let months = today.getMonth() - birth.getMonth();

    if (today.getDate() < birth.getDate()) months--;
    if (months < 0) { years--; months += 12; }

    if (years === 0) return `${months}M`;
    if (months === 0) return `${years}Y`;
    return `${years}Y ${months}M`;
}

/**
 * Picks the best guardian contact record from a student's guardian list.
 * Priority: primary guardian → first guardian with data → null.
 */
function getPrimaryGuardian(guardians: GuardianContact[] | undefined): GuardianContact['guardians'] | null {
    if (!guardians || guardians.length === 0) return null;
    const primary = guardians.find(g => g.is_primary && g.guardians);
    if (primary?.guardians) return primary.guardians;
    return guardians.find(g => g.guardians)?.guardians ?? null;
}

/**
 * Returns hover-only row classes based on student gender.
 * Rows are white at rest — the color only appears on hover,
 * giving a subtle visual cue without cluttering the table.
 */
function getGenderRowClass(gender: string | null | undefined): string {
    if (gender === 'Male') return 'hover:bg-blue-100';
    if (gender === 'Female') return 'hover:bg-rose-100';
    return 'hover:bg-gray-50';
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StudentsPage() {
    const router = useRouter();
    const { selectedOrganization } = useOrganization();
    const queryClient = useQueryClient();

    // ── Filter / sort state ────────────────────────────────────────────────
    const [selectedYear, setSelectedYear] = useState<string>('');
    // 'asc' = lowest grade first (default), 'desc' = highest grade first
    const [gradeSort, setGradeSort] = useState<'asc' | 'desc'>('asc');

    // ── Modal state ───────────────────────────────────────────────────────
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isImportOpen, setIsImportOpen] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);
    const [vacationStudent, setVacationStudent] = useState<Student | null>(null);

    // ── TanStack Queries ──────────────────────────────────────────────────

    /** Academic years list for the filter dropdown */
    const { data: academicYears = [] } = useAcademicYears();

    /**
     * Student roster — only runs when orgId and selectedYear are both set.
     * Enrollment data is pre-filtered to the selected academic year by the query.
     */
    const { data: students = [], isLoading } = useStudents(selectedOrganization?.id, selectedYear);

    /** Students sorted by grade order; falls back to grade name alphabetically */
    const sortedStudents = [...(students as Student[])].sort((a, b) => {
        const gradeA = a.enrollments?.[0]?.grades;
        const gradeB = b.enrollments?.[0]?.grades;
        const orderA = gradeA?.order ?? 9999;
        const orderB = gradeB?.order ?? 9999;
        if (orderA !== orderB) return gradeSort === 'asc' ? orderA - orderB : orderB - orderA;
        // Secondary sort: grade name alphabetically when order values are identical/missing
        const nameA = gradeA?.name ?? '';
        const nameB = gradeB?.name ?? '';
        return gradeSort === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
    });

    // ── Side effect: set default academic year once list loads ────────────
    useEffect(() => {
        if ((academicYears as AcademicYear[]).length > 0 && !selectedYear) {
            const active = (academicYears as AcademicYear[]).find(y => y.is_active);
            setSelectedYear(active?.id ?? (academicYears as AcademicYear[])[0]?.id ?? '');
        }
    }, [academicYears, selectedYear]);

    // ── Handlers ──────────────────────────────────────────────────────────

    const handleAdd = () => { setEditingStudent(null); setIsFormOpen(true); };

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">

            {/* ── Page Header ──────────────────────────────────────────────── */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Students List</h2>
                    <p className="text-gray-500 text-sm">Manage Student Information</p>
                </div>
                <div className="flex items-center gap-2">
                    {/* Academic year filter — changing this updates the query key,
                        causing TanStack Query to fetch for the new year */}
                    <div className="relative">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="appearance-none bg-white border border-gray-300 text-gray-700 py-2 pl-3 pr-8 rounded-lg leading-tight focus:outline-none focus:bg-white focus:border-gray-500"
                        >
                            <option value="">Select Year...</option>
                            {(academicYears as AcademicYear[]).map(year => (
                                <option key={year.id} value={year.id}>{year.name}</option>
                            ))}
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <Filter size={16} />
                        </div>
                    </div>
                    <button
                        onClick={handleAdd}
                        className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                    >
                        <Plus size={18} /> Add Student
                    </button>
                </div>
            </div>

            {/* ── Students Table ────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Full Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Age</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Email</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                            <th
                                className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase cursor-pointer select-none hover:text-indigo-600 transition-colors"
                                onClick={() => setGradeSort(s => s === 'asc' ? 'desc' : 'asc')}
                                title="Click to toggle sort order"
                            >
                                Grade {gradeSort === 'asc' ? '↑' : '↓'}
                            </th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Classroom</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400">
                                    Loading students...
                                </td>
                            </tr>
                        ) : (students as Student[]).length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-8 text-center text-gray-400">
                                    No students found for this year.
                                </td>
                            </tr>
                        ) : (
                            sortedStudents.map(student => {
                                // Derive display values — prefer root dob (legacy column), fall back to persons.dob
                                const age = getAge(student.dob ?? student.person.dob);
                                const guardian = getPrimaryGuardian(student.student_guardians);
                                const email = guardian?.email || null;
                                const phone = guardian?.phone || null;

                                // Enrollment for this specific year (query already filters it)
                                const enrollment = student.enrollments?.[0];
                                const classroom = enrollment?.classrooms?.name ?? 'Unassigned';
                                const grade = enrollment?.grades?.name ?? 'N/A';

                                // Subtle gender-based background
                                const rowClass = getGenderRowClass(student.gender);

                                return (
                                    <tr
                                        key={student.id}
                                        onClick={() => router.push(`/admin/students/${student.id}`)}
                                        className={`group transition-colors cursor-pointer ${rowClass}`}
                                    >
                                        {/* Name + avatar */}
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-9 w-9 rounded-full flex items-center justify-center text-indigo-600 font-bold overflow-hidden border border-indigo-100 bg-indigo-50 flex-shrink-0">
                                                    {student.person.photo_url ? (
                                                        // eslint-disable-next-line @next/next/no-img-element
                                                        <img src={student.person.photo_url} alt={student.person.first_name} className="h-full w-full object-cover" />
                                                    ) : (
                                                        student.person.first_name[0]
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                                                        {student.person.first_name} {student.person.last_name}
                                                    </span>
                                                    <p className="text-xs text-gray-400">ID: {student.student_number}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Age — calculated from dob */}
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {age !== null ? age : <span className="text-gray-400">—</span>}
                                        </td>

                                        {/* Email — from primary guardian */}
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {email
                                                ? <a href={`mailto:${email}`} onClick={e => e.stopPropagation()} className="hover:text-indigo-600 hover:underline">{email}</a>
                                                : <span className="text-gray-400">-</span>
                                            }
                                        </td>

                                        {/* Phone — from primary guardian */}
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {phone
                                                ? <a href={`tel:${phone}`} onClick={e => e.stopPropagation()} className="hover:text-indigo-600 hover:underline">{phone}</a>
                                                : <span className="text-gray-400">-</span>
                                            }
                                        </td>

                                        {/* Grade — from enrollment for selected year */}
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium">
                                                {grade}
                                            </span>
                                        </td>

                                        {/* Classroom — from enrollment for selected year */}
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            {classroom}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* ── Modals ───────────────────────────────────────────────────── */}

            {/* Add/Edit Student form */}
            <StudentForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                student={editingStudent}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['students', selectedOrganization?.id, selectedYear] })}
            />

            {/* Per-student vacation management modal */}
            {vacationStudent && (
                <VacationModal
                    isOpen={!!vacationStudent}
                    onClose={() => setVacationStudent(null)}
                    studentId={vacationStudent.id}
                    studentName={`${vacationStudent.person.first_name} ${vacationStudent.person.last_name}`}
                />
            )}

            {/* CSV import modal */}
            <CsvStudentImport
                isOpen={isImportOpen}
                onClose={() => setIsImportOpen(false)}
                onSuccess={() => queryClient.invalidateQueries({ queryKey: ['students', selectedOrganization?.id, selectedYear] })}
            />
        </div>
    );
}