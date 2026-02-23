'use client';

/**
 * Staff Management Page
 * ---------------------
 * Uses DataTable component with clickable rows (navigates to /admin/staff/[id]).
 * Actions column removed — entire row is the navigation target.
 */

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import StaffForm from '@/components/admin/StaffForm';
import { useOrganization } from '@/context/OrganizationContext';
import { useStaff } from '@/lib/queries';
import { useQueryClient } from '@tanstack/react-query';
import { DataTable, DataTableColumn } from '@/components/DataTable';
import { Card, CardContent } from '@/components/ui/card';

// ── Types ─────────────────────────────────────────────────────────────────────

interface TeacherClassroom {
    classrooms: { name: string } | null;
}

interface StaffProfile {
    id: string;
    name: string;
    email: string;
    role: string;
    user_id: string | null;
    teacher_classrooms: TeacherClassroom[];
}

// ── Role badge helper ─────────────────────────────────────────────────────────

function RoleBadge({ role }: { role: string }) {
    const cls =
        role === 'ADMIN'
            ? 'bg-red-50 text-red-700 border-red-100'
            : role === 'TEACHER'
                ? 'bg-blue-50 text-blue-700 border-blue-100'
                : 'bg-gray-50 text-gray-700 border-gray-100';
    return (
        <span className={`px-2 py-1 rounded text-xs font-medium border ${cls}`}>
            {role}
        </span>
    );
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function StaffPage() {
    const router = useRouter();
    const { selectedOrganization } = useOrganization();
    const queryClient = useQueryClient();
    const { data: staffMembers = [], isLoading } = useStaff(selectedOrganization?.id);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);

    const handleAdd = () => {
        setEditingStaff(null);
        setIsFormOpen(true);
    };

    const handleSuccess = () => {
        queryClient.invalidateQueries({ queryKey: ['staff', selectedOrganization?.id] });
    };

    // ── Column definitions ────────────────────────────────────────────────

    const columns: DataTableColumn<StaffProfile>[] = useMemo(() => [
        {
            id: 'name',
            header: 'Name',
            cellClassName: 'px-6 py-4',
            cell: (staff) => (
                <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="h-9 w-9 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                        {staff.name?.[0]?.toUpperCase() ?? '?'}
                    </div>
                    <div>
                        <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {staff.name}
                        </p>
                        <p className="text-xs text-gray-400">{staff.email}</p>
                    </div>
                </div>
            ),
        },
        {
            id: 'role',
            header: 'Role',
            cell: (staff) => <RoleBadge role={staff.role} />,
        },
        {
            id: 'login',
            header: 'Login',
            cell: (staff) =>
                staff.user_id ? (
                    <span className="text-green-600 text-xs font-medium flex items-center gap-1">
                        ✓ Enabled
                    </span>
                ) : (
                    <span className="text-gray-400 text-xs italic">No login</span>
                ),
        },
        {
            id: 'classrooms',
            header: 'Classrooms',
            cell: (staff) => {
                if (staff.role !== 'TEACHER') return <span className="text-gray-300 text-xs">—</span>;
                const cls = staff.teacher_classrooms ?? [];
                if (cls.length === 0)
                    return <span className="text-gray-400 italic text-xs">Unassigned</span>;
                return (
                    <div className="flex flex-wrap gap-1">
                        {cls.map((tc, i) => (
                            <span
                                key={i}
                                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] border border-gray-200"
                            >
                                {tc.classrooms?.name}
                            </span>
                        ))}
                    </div>
                );
            },
        },
    ], []);

    // ── Render ────────────────────────────────────────────────────────────

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">Staff Management</h2>
                    <p className="text-gray-500 text-sm">Manage teaching staff and assignments.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-indigo-700 transition-colors"
                >
                    <Plus size={18} /> Add Staff
                </button>
            </div>

            {/* Table */}
            <Card className="overflow-hidden">
                <CardContent className="p-0">
                    <DataTable<StaffProfile>
                        columns={columns}
                        data={staffMembers as StaffProfile[]}
                        keyExtractor={(s) => s.id}
                        isLoading={isLoading}
                        loadingMessage="Loading staff..."
                        emptyMessage="No staff members found."
                        onRowClick={(staff) => router.push(`/admin/staff/${staff.id}`)}
                        colSpan={columns.length}
                    />
                </CardContent>
            </Card>

            {/* Add / Edit modal */}
            <StaffForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                teacher={editingStaff}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
