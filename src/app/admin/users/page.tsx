'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Users, Mail, Shield, Edit2, UserPlus, X, Check, Trash2, Key } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { createUser, updateUser, deleteUser } from '@/app/actions/users';

interface Profile {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
    roles: string[] | null;
    created_at?: string;
}

const AVAILABLE_ROLES = ['ADMIN', 'TEACHER', 'OFFICE', 'PARENT'];

export default function UsersPage() {
    const supabase = createClient();
    const [profiles, setProfiles] = useState<Profile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Create Modal State
    const [showCreate, setShowCreate] = useState(false);
    const [createData, setCreateData] = useState({ name: '', email: '', password: '', roles: ['TEACHER'] });

    // Edit Modal State
    const [editingProfile, setEditingProfile] = useState<Profile | null>(null);
    const [editData, setEditData] = useState({ name: '', roles: [] as string[], password: '' });

    // Delete Confirmation
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [processing, setProcessing] = useState(false);

    const fetchProfiles = useCallback(async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('name', { ascending: true });

        if (error) console.error('Error fetching profiles:', error);
        else setProfiles(data || []);
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        fetchProfiles();
    }, [fetchProfiles]);

    const handleCreate = async () => {
        if (!createData.email || !createData.password || !createData.name) {
            alert('Please fill all required fields');
            return;
        }
        setProcessing(true);
        try {
            await createUser(createData);
            alert('User created successfully!');
            setShowCreate(false);
            setCreateData({ name: '', email: '', password: '', roles: ['TEACHER'] });
            fetchProfiles();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
        setProcessing(false);
    };

    const handleUpdate = async () => {
        if (!editingProfile) return;
        setProcessing(true);
        try {
            await updateUser(editingProfile.id, {
                name: editData.name,
                roles: editData.roles,
                password: editData.password || undefined
            });
            alert('User updated successfully!');
            setEditingProfile(null);
            fetchProfiles();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
        setProcessing(false);
    };

    const handleDelete = async () => {
        if (!deletingId) return;
        setProcessing(true);
        try {
            await deleteUser(deletingId);
            setDeletingId(null);
            fetchProfiles();
        } catch (error: any) {
            alert('Error: ' + error.message);
        }
        setProcessing(false);
    };

    const filteredProfiles = profiles.filter(p =>
        (p.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (p.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const getRoleBadgeColor = (role: string) => {
        switch (role) {
            case 'ADMIN': return 'bg-red-100 text-red-700 border-red-200';
            case 'TEACHER': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'OFFICE': return 'bg-green-100 text-green-700 border-green-200';
            case 'PARENT': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
    };

    // Helper to get display roles, falling back to legacy single role
    const getDisplayRoles = (p: Profile) => {
        if (p.roles && p.roles.length > 0) return p.roles;
        return [p.role];
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Users className="text-brand-olive" />
                        User Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Manage users, roles, and access.</p>
                </div>
                <button
                    onClick={() => setShowCreate(true)}
                    className="bg-brand-olive text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-opacity-90 flex items-center gap-2 shadow-sm transition-transform active:scale-95"
                >
                    <UserPlus size={16} />
                    Create User
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {AVAILABLE_ROLES.map(role => (
                    <Card key={role}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`p-2 rounded-full ${getRoleBadgeColor(role).split(' ')[0]}`}>
                                <Shield size={18} className={getRoleBadgeColor(role).split(' ')[1]} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {profiles.filter(p => getDisplayRoles(p).includes(role)).length}
                                </p>
                                <p className="text-xs text-gray-500">{role}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Search & Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-semibold text-gray-900">All Users ({profiles.length})</h3>
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-64 px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-brand-olive focus:ring-1 focus:ring-brand-olive"
                    />
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Contact</th>
                                <th className="px-6 py-4">Roles</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProfiles.map(p => (
                                <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900">{p.name || 'No Name'}</span>
                                            {/* Hidden password indicator for visual cue */}
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                <Key size={10} /> ••••••••
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Mail size={14} className="text-gray-400" />
                                            {p.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {getDisplayRoles(p).map(role => (
                                                <span key={role} className={`px-2 py-0.5 text-xs font-medium rounded border ${getRoleBadgeColor(role)}`}>
                                                    {role}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                onClick={() => {
                                                    setEditingProfile(p);
                                                    setEditData({
                                                        name: p.name || '',
                                                        roles: getDisplayRoles(p),
                                                        password: ''
                                                    });
                                                }}
                                                className="text-brand-olive hover:bg-brand-olive/10 p-1.5 rounded transition-colors"
                                                title="Edit User"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeletingId(p.id)}
                                                className="text-red-500 hover:bg-red-50 p-1.5 rounded transition-colors"
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create User Modal */}
            {showCreate && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h3 className="text-xl font-bold text-gray-900">Create New User</h3>
                            <button onClick={() => setShowCreate(false)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium block mb-1">Name</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-olive/20 focus:border-brand-olive outline-none"
                                    placeholder="Full Name"
                                    value={createData.name}
                                    onChange={e => setCreateData({ ...createData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Email</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-olive/20 focus:border-brand-olive outline-none"
                                    type="email"
                                    placeholder="email@example.com"
                                    value={createData.email}
                                    onChange={e => setCreateData({ ...createData, email: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Password</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-olive/20 focus:border-brand-olive outline-none"
                                    type="password"
                                    placeholder="••••••••"
                                    value={createData.password}
                                    onChange={e => setCreateData({ ...createData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Roles</label>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_ROLES.map(role => (
                                        <button key={role}
                                            onClick={() => {
                                                const newRoles = createData.roles.includes(role)
                                                    ? createData.roles.filter(r => r !== role)
                                                    : [...createData.roles, role];
                                                if (newRoles.length > 0) setCreateData({ ...createData, roles: newRoles });
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${createData.roles.includes(role)
                                                    ? 'bg-brand-olive text-white border-brand-olive'
                                                    : 'bg-white text-gray-600 border-gray-300 hover:border-brand-olive hover:text-brand-olive'
                                                }`}>
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4 border-t mt-2">
                            <button onClick={() => setShowCreate(false)} className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
                                Cancel
                            </button>
                            <button onClick={handleCreate} disabled={processing} className="flex-1 bg-brand-olive text-white py-2.5 rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                                {processing ? 'Creating...' : 'Create User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingProfile && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center border-b pb-3">
                            <h3 className="text-xl font-bold text-gray-900">Edit User</h3>
                            <button onClick={() => setEditingProfile(null)}><X size={20} className="text-gray-400 hover:text-gray-600" /></button>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium block mb-1">Name</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-olive/20 focus:border-brand-olive outline-none"
                                    value={editData.name}
                                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium block mb-1">Reset Password (Optional)</label>
                                <input
                                    className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-brand-olive/20 focus:border-brand-olive outline-none"
                                    type="password"
                                    placeholder="Leave blank to keep current"
                                    value={editData.password}
                                    onChange={e => setEditData({ ...editData, password: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Roles</label>
                                <div className="flex flex-wrap gap-2">
                                    {AVAILABLE_ROLES.map(role => (
                                        <button key={role}
                                            onClick={() => {
                                                const newRoles = editData.roles.includes(role)
                                                    ? editData.roles.filter(r => r !== role)
                                                    : [...editData.roles, role];
                                                if (newRoles.length > 0) setEditData({ ...editData, roles: newRoles });
                                            }}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${editData.roles.includes(role)
                                                    ? 'bg-brand-olive text-white border-brand-olive'
                                                    : 'bg-white text-gray-600 border-gray-300 hover:border-brand-olive hover:text-brand-olive'
                                                }`}>
                                            {role}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                        <div className="flex gap-3 pt-4 border-t mt-2">
                            <button onClick={() => setEditingProfile(null)} className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">
                                Cancel
                            </button>
                            <button onClick={handleUpdate} disabled={processing} className="flex-1 bg-brand-olive text-white py-2.5 rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                                {processing ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {deletingId && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4 text-center animate-in fade-in zoom-in-95 duration-200">
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
                            <Trash2 className="text-red-600" size={24} />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">Delete User?</h3>
                        <p className="text-gray-600">This action cannot be undone. The user will lose access immediately.</p>
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setDeletingId(null)} className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50">Cancel</button>
                            <button onClick={handleDelete} disabled={processing} className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed">
                                {processing ? 'Deleting...' : 'Delete User'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
