'use client';

/**
 * Staff Management Page
 * ---------------------
 * Uses TanStack Query (useStaff) with queryClient.invalidateQueries for mutation refresh.
 */

import { useState } from 'react';
import { Plus, Edit, Eye } from 'lucide-react';
import Link from 'next/link';
import StaffForm from '@/components/admin/StaffForm';
import { useOrganization } from '@/context/OrganizationContext';
import { useStaff } from '@/lib/queries';
import { useQueryClient } from '@tanstack/react-query';

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

export default function StaffPage() {
    const { selectedOrganization } = useOrganization();
    const queryClient = useQueryClient();
    const { data: staffMembers = [], isLoading } = useStaff(selectedOrganization?.id);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingStaff, setEditingStaff] = useState<StaffProfile | null>(null);

    const handleEdit = (staff: StaffProfile) => {
        setEditingStaff(staff);
        setIsFormOpen(true);
    };

    const handleAdd = () => {
        setEditingStaff(null);
        setIsFormOpen(true);
    };

    const handleSuccess = () => {
        // Invalidate the staff query so the list refreshes automatically
        queryClient.invalidateQueries({ queryKey: ['staff', selectedOrganization?.id] });
    };

    return (
        <div className="space-y-6">
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

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Role</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Email/Login</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase">Details</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {isLoading ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-400">Loading staff...</td></tr>
                        ) : staffMembers.length === 0 ? (
                            <tr><td colSpan={5} className="p-8 text-center text-gray-400">No staff found.</td></tr>
                        ) : (
                            (staffMembers as StaffProfile[]).map(staff => (
                                <tr key={staff.id} className="hover:bg-gray-50 group transition-colors">
                                    <td className="px-6 py-4 font-semibold text-gray-900">
                                        <Link href={`/admin/staff/${staff.id}`} className="hover:text-indigo-600 hover:underline">
                                            {staff.name}
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <span className={`px-2 py-1 rounded text-xs font-medium border ${staff.role === 'ADMIN' ? 'bg-red-50 text-red-700 border-red-100' :
                                            staff.role === 'TEACHER' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                                'bg-gray-50 text-gray-700 border-gray-100'
                                            }`}>
                                            {staff.role}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        <div>{staff.email}</div>
                                        <div className="text-xs mt-0.5">
                                            {staff.user_id ? (
                                                <span className="text-green-600 flex items-center gap-1">✓ Login Enabled</span>
                                            ) : (
                                                <span className="text-gray-400">No Login</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {staff.role === 'TEACHER' && (
                                            <div className="flex flex-wrap gap-1">
                                                {staff.teacher_classrooms?.map((tc, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] border border-gray-200">
                                                        {tc.classrooms?.name}
                                                    </span>
                                                ))}
                                                {(!staff.teacher_classrooms || staff.teacher_classrooms.length === 0) && (
                                                    <span className="text-gray-400 italic text-xs">Unknown Class</span>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/admin/staff/${staff.id}`}
                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="View Details"
                                        >
                                            <Eye size={18} />
                                        </Link>
                                        <button
                                            onClick={() => handleEdit(staff)}
                                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Edit"
                                        >
                                            <Edit size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <StaffForm
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                teacher={editingStaff}
                onSuccess={handleSuccess}
            />
        </div>
    );
}
