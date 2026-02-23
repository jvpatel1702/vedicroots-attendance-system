/**
 * Students Index Page (Admin)
 * ---------------------------
 * Displays the full student roster filtered by academic year, classroom, and grade.
 *
 * Data flow:
 *  - `useAcademicYears()` — fetches academic years for the year-filter dropdown.
 *  - `useStudents(orgId, selectedYear)` — fetches students for a specific org+year.
 *    Includes gender (for row coloring), dob (for age), and guardian contact info.
 *
 * Quick Operations:
 *  - Filter by Academic Year (existing)
 *  - Filter by Classroom     (new — derived client-side from loaded students)
 *  - Filter by Grade         (new — derived client-side from loaded students)
 *  - Copy Emails             (new — copies all guardian emails of the filtered list)
 *
 * Row coloring:
 *  - Male   → subtle blue  (hover:bg-blue-100)
 *  - Female → subtle rose  (hover:bg-rose-100)
 *  - Other/unset → neutral (hover:bg-gray-50)
 *
 * Email / Phone:
 *  - Pulled from the student's primary guardian first.
 *  - Falls back to the first available guardian if none is marked primary.
 *  - Displays "—" when no guardian contact exists.
 */
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Filter, Plus, Copy, Check, X } from 'lucide-react';

import StudentForm from '@/components/admin/StudentForm';
import VacationModal from '@/components/admin/VacationModal';
import CsvStudentImport from '@/components/admin/CsvStudentImport';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useOrganization } from '@/context/OrganizationContext';
import { useStudents, useAcademicYears, useEnrollments, ALL_YEARS_VALUE } from '@/lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import WidgetCard from '@/components/WidgetCard';
import { BookOpen } from 'lucide-react';

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
  dob?: string | null; // from students table (legacy column)
  person: {
    first_name: string;
    last_name: string;
    dob?: string | null; // from persons table (new column)
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
    academic_years?: { id: string; name: string } | null;
    classroom_id: string;
    grade_id: string;
    academic_year_id: string;
    status: string;
  }[];
}

interface AcademicYear {
  id: string;
  name: string;
  is_active: boolean;
}

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
  if (months < 0) {
    years--;
    months += 12;
  }

  if (years === 0) return `${months}M`;
  if (months === 0) return `${years}Y`;
  return `${years}Y, ${months}M`;
}

/**
 * Picks the best guardian contact record from a student's guardian list.
 * Priority: primary guardian → first guardian with data → null.
 */
function getPrimaryGuardian(
  guardians: GuardianContact[] | undefined
): GuardianContact['guardians'] | null {
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

/** Sentinel value used to represent "no filter selected" in dropdowns */
const ALL_VALUE = '__ALL__';

// ── Component ─────────────────────────────────────────────────────────────────

export default function StudentsPage() {
  const router = useRouter();
  const { selectedOrganization } = useOrganization();
  const queryClient = useQueryClient();

  // ── Filter / sort state ────────────────────────────────────────────────
  const [selectedYear, setSelectedYear] = useState<string>('');
  /** Client-side classroom filter — value is classroom name */
  const [selectedClassroom, setSelectedClassroom] = useState<string>(ALL_VALUE);
  /** Client-side grade filter — value is grade name */
  const [selectedGrade, setSelectedGrade] = useState<string>(ALL_VALUE);
  // 'asc' = lowest grade first (default), 'desc' = highest grade first
  const [gradeSort, setGradeSort] = useState<'asc' | 'desc'>('asc');

  // ── Copy-emails state ─────────────────────────────────────────────────
  /** Tracks clipboard copy confirmation ("idle" | "copied" | "none") */
  const [copyState, setCopyState] = useState<'idle' | 'copied' | 'none'>('idle');

  // ── Modal state ───────────────────────────────────────────────────────
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [vacationStudent, setVacationStudent] = useState<Student | null>(null);

  // ── TanStack Queries ──────────────────────────────────────────────────
  const { data: enrollments = [] } =
    useEnrollments(selectedYear);

  /** Academic years list for the filter dropdown */
  const { data: academicYears = [] } = useAcademicYears();

  /**
   * Student roster — only runs when orgId and selectedYear are both set.
   * Enrollment data is pre-filtered to the selected academic year by the query.
   */
  const { data: students = [], isLoading } = useStudents(
    selectedOrganization?.id,
    selectedYear
  );

  // ── Derived filter options (built from fetched data) ──────────────────

  /**
   * Unique, sorted classroom names that exist in the current student list.
   * Used to populate the Classroom filter dropdown.
   */
  const classroomOptions = useMemo(() => {
    const names = new Set<string>();
    (students as Student[]).forEach(s => {
      const name = s.enrollments?.[0]?.classrooms?.name;
      if (name) names.add(name);
    });
    return Array.from(names).sort();
  }, [students]);

  /**
   * Unique grade options (name + order) derived from the current student list.
   * Sorted by grade order so the dropdown matches the table's natural order.
   */
  const gradeOptions = useMemo(() => {
    const map = new Map<string, number>();
    (students as Student[]).forEach(s => {
      const grade = s.enrollments?.[0]?.grades;
      if (grade?.name) {
        map.set(grade.name, grade.order ?? 9999);
      }
    });
    return Array.from(map.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([name]) => name);
  }, [students]);

  // ── Reset secondary filters when year changes ─────────────────────────
  useEffect(() => {
    setSelectedClassroom(ALL_VALUE);
    setSelectedGrade(ALL_VALUE);
  }, [selectedYear]);

  // ── Sorted + filtered student list ────────────────────────────────────

  /** Students sorted by grade order, then filtered by classroom and grade */
  const sortedStudents = useMemo(() => {
    const sorted = [...(students as Student[])].sort((a, b) => {
      const gradeA = a.enrollments?.[0]?.grades;
      const gradeB = b.enrollments?.[0]?.grades;
      const orderA = gradeA?.order ?? 9999;
      const orderB = gradeB?.order ?? 9999;
      if (orderA !== orderB)
        return gradeSort === 'asc' ? orderA - orderB : orderB - orderA;
      const nameA = gradeA?.name ?? '';
      const nameB = gradeB?.name ?? '';
      return gradeSort === 'asc'
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA);
    });

    return sorted.filter(s => {
      const classroomName = s.enrollments?.[0]?.classrooms?.name ?? null;
      const gradeName = s.enrollments?.[0]?.grades?.name ?? null;

      if (selectedClassroom !== ALL_VALUE && classroomName !== selectedClassroom) return false;
      if (selectedGrade !== ALL_VALUE && gradeName !== selectedGrade) return false;
      return true;
    });
  }, [students, gradeSort, selectedClassroom, selectedGrade]);

  const isAllYears = selectedYear === ALL_YEARS_VALUE;

  // ── Copy Emails handler ───────────────────────────────────────────────

  /**
   * Collects the primary guardian email for every visible (filtered) student,
   * deduplicates them, and copies the comma-separated list to the clipboard.
   */
  const handleCopyEmails = useCallback(async () => {
    const emails: string[] = [];
    sortedStudents.forEach(s => {
      const guardian = getPrimaryGuardian(s.student_guardians);
      if (guardian?.email) emails.push(guardian.email.trim().toLowerCase());
    });

    const unique = Array.from(new Set(emails));

    if (unique.length === 0) {
      setCopyState('none');
      setTimeout(() => setCopyState('idle'), 2500);
      return;
    }

    try {
      await navigator.clipboard.writeText(unique.join(', '));
      setCopyState('copied');
    } catch {
      // Browser may block clipboard in insecure contexts; fallback via textarea
      const el = document.createElement('textarea');
      el.value = unique.join(', ');
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopyState('copied');
    }
    setTimeout(() => setCopyState('idle'), 2500);
  }, [sortedStudents]);

  const studentColumns: DataTableColumn<Student>[] = useMemo(() => {
    const base: DataTableColumn<Student>[] = [
      {
        id: 'name',
        header: 'Full Name',
        cellClassName: 'px-6 py-4',
        cell: student => {
          return (
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full flex items-center justify-center text-indigo-600 font-bold overflow-hidden border border-indigo-100 bg-indigo-50 flex-shrink-0">
                {student.person.photo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={student.person.photo_url}
                    alt={student.person.first_name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  student.person.first_name[0]
                )}
              </div>
              <div>
                <span className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {student.person.first_name} {student.person.last_name}
                </span>
                <p className="text-xs text-gray-400">
                  ID: {student.student_number}
                </p>
              </div>
            </div>
          );
        },
      },
      {
        id: 'age',
        header: 'Age',
        cell: student => {
          const age = getAge(student.dob ?? student.person.dob);
          return age !== null ? age : <span className="text-gray-400">—</span>;
        },
      },
      {
        id: 'grade',
        header: 'Grade',
        sortKey: 'grade',
        cell: student => {
          const hasEnrollment = (student.enrollments?.length ?? 0) > 0;
          const grade =
            student.enrollments?.[0]?.grades?.name ?? (hasEnrollment ? 'N/A' : null);
          const display = grade ?? '—';
          const isNoEnrollment = display === '—';
          return (
            <Badge
              variant="secondary"
              className={
                isNoEnrollment
                  ? 'text-xs font-medium bg-muted text-muted-foreground'
                  : 'text-xs font-medium'
              }
            >
              {display}
            </Badge>
          );
        },
      },
      ...(isAllYears
        ? [
          {
            id: 'year',
            header: 'Year',
            cell: (student: Student) => {
              const yearName = (student.enrollments?.[0] as { academic_years?: { name: string } } | undefined)?.academic_years?.name;
              return (
                <span className={!yearName ? 'text-muted-foreground' : undefined}>
                  {yearName ?? '—'}
                </span>
              );
            },
          } as DataTableColumn<Student>,
        ]
        : []),
      {
        id: 'classroom',
        header: 'Classroom',
        cell: student => {
          const hasEnrollment = (student.enrollments?.length ?? 0) > 0;
          const classroom =
            student.enrollments?.[0]?.classrooms?.name ??
            (hasEnrollment ? 'Unassigned' : '—');
          return (
            <span
              className={
                classroom === '—'
                  ? 'text-muted-foreground'
                  : undefined
              }
            >
              {classroom}
            </span>
          );
        },
      },
    ];
    return base;
  }, [isAllYears]);

  // ── Side effect: set default academic year once list loads ────────────
  useEffect(() => {
    if ((academicYears as AcademicYear[]).length > 0 && !selectedYear) {
      const active = (academicYears as AcademicYear[]).find(y => y.is_active);
      setSelectedYear(
        active?.id ?? (academicYears as AcademicYear[])[0]?.id ?? ''
      );
    }
  }, [academicYears, selectedYear]);

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleAdd = () => {
    setEditingStudent(null);
    setIsFormOpen(true);
  };

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* ── Page Header ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Students List</h2>
          <p className="text-gray-500 text-sm">Manage Student Information</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button onClick={handleAdd} className="gap-2">
            <Plus size={18} /> Add Student
          </Button>
        </div>
      </div>

      {/* ── Quick Operations / Filters bar ───────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2 p-3 bg-muted/40 rounded-lg border border-border">

        {/* Academic Year filter */}
        <Select
          value={selectedYear}
          onValueChange={value => setSelectedYear(value)}
        >
          <SelectTrigger className="w-[180px] bg-white">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-muted-foreground shrink-0" />
              <SelectValue placeholder="Select Year..." />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_YEARS_VALUE}>All Years</SelectItem>
            {(academicYears as AcademicYear[]).map(year => (
              <SelectItem key={year.id} value={year.id}>
                {year.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Classroom filter */}
        <Select
          value={selectedClassroom}
          onValueChange={value => setSelectedClassroom(value)}
          disabled={classroomOptions.length === 0}
        >
          <SelectTrigger className="w-[170px] bg-white">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-muted-foreground shrink-0" />
              <SelectValue placeholder="All Classrooms" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All Classrooms</SelectItem>
            {classroomOptions.map(name => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Grade filter */}
        <Select
          value={selectedGrade}
          onValueChange={value => setSelectedGrade(value)}
          disabled={gradeOptions.length === 0}
        >
          <SelectTrigger className="w-[150px] bg-white">
            <div className="flex items-center gap-2">
              <Filter size={14} className="text-muted-foreground shrink-0" />
              <SelectValue placeholder="All Grades" />
            </div>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_VALUE}>All Grades</SelectItem>
            {gradeOptions.map(name => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Active filter chips */}
        {selectedClassroom !== ALL_VALUE && (
          <Badge
            variant="secondary"
            className="flex items-center gap-1 pl-2 pr-1 py-1 cursor-pointer hover:bg-muted"
            onClick={() => setSelectedClassroom(ALL_VALUE)}
          >
            {selectedClassroom}
            <X size={12} />
          </Badge>
        )}
        {selectedGrade !== ALL_VALUE && (
          <Badge
            variant="secondary"
            className="flex items-center gap-1 pl-2 pr-1 py-1 cursor-pointer hover:bg-muted"
            onClick={() => setSelectedGrade(ALL_VALUE)}
          >
            {selectedGrade}
            <X size={12} />
          </Badge>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Visible count */}
        <span className="text-sm text-muted-foreground whitespace-nowrap">
          {sortedStudents.length} student{sortedStudents.length !== 1 ? 's' : ''}
        </span>

        {/* Copy Emails button */}
        <Button
          variant="outline"
          size="sm"
          className="gap-2 bg-white"
          onClick={handleCopyEmails}
          disabled={isLoading}
          title="Copy guardian emails of visible students to clipboard"
        >
          {copyState === 'copied' ? (
            <>
              <Check size={14} className="text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : copyState === 'none' ? (
            <>
              <Copy size={14} className="text-amber-600" />
              <span className="text-amber-600">No emails</span>
            </>
          ) : (
            <>
              <Copy size={14} />
              Copy Emails
            </>
          )}
        </Button>
      </div>

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <WidgetCard
          title="Total Enrollments"
          value={enrollments.length}
          icon={BookOpen}
        />
        <WidgetCard
          title="Active"
          value={
            (enrollments as { status: string }[]).filter(
              e => e.status === 'ACTIVE'
            ).length
          }
          icon={BookOpen}
          iconClassName="bg-green-100 text-green-600"
        />
        <WidgetCard
          title="Graduated"
          value={
            (enrollments as { status: string }[]).filter(
              e => e.status === 'GRADUATED'
            ).length
          }
          icon={BookOpen}
          iconClassName="bg-blue-100 text-blue-600"
        />
        <WidgetCard
          title="Inactive/Withdrawn"
          value={
            (enrollments as { status: string }[]).filter(
              e => e.status === 'INACTIVE' || e.status === 'WITHDRAWN'
            ).length
          }
          icon={BookOpen}
          iconClassName="bg-gray-100 text-gray-600"
        />
      </div>

      {/* ── Students Table ────────────────────────────────────────────── */}
      {isAllYears && (
        <p className="text-sm text-muted-foreground">
          Students with no enrollment in any year appear with Grade, Year, and Classroom as &quot;—&quot;. You can enroll them from the Enrollments page for a specific academic year.
        </p>
      )}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <DataTable<Student>
            columns={studentColumns}
            data={sortedStudents}
            keyExtractor={s => s.id}
            isLoading={isLoading}
            loadingMessage="Loading students..."
            emptyMessage="No students found for this filter."
            onRowClick={student =>
              router.push(`/admin/students/${student.id}`)
            }
            getRowClassName={s => getGenderRowClass(s.gender)}
            sortState={{ key: 'grade', direction: gradeSort }}
            onSort={() =>
              setGradeSort(prev => (prev === 'asc' ? 'desc' : 'asc'))
            }
            colSpan={studentColumns.length}
          />
        </CardContent>
      </Card>

      {/* ── Modals ───────────────────────────────────────────────────── */}

      {/* Add/Edit Student form */}
      <StudentForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        student={editingStudent}
        onSuccess={() =>
          queryClient.invalidateQueries({
            queryKey: ['students', selectedOrganization?.id, selectedYear],
          })
        }
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
        onSuccess={() =>
          queryClient.invalidateQueries({
            queryKey: ['students', selectedOrganization?.id, selectedYear],
          })
        }
      />
    </div>
  );
}
