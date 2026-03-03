'use client';

import { useState, useEffect, useCallback } from 'react';
import { Users, Mail, Shield, Edit2, UserPlus, Trash2, Key } from 'lucide-react';

import { createClient } from '@/lib/supabaseClient';
import { createUser, updateUser, deleteUser } from '@/lib/actions/users';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';

/**
 * A user profile joined with their roles from the `user_roles` table.
 * `profiles` only stores: id, name, email.
 * Role data exclusively lives in `user_roles`.
 */
interface Profile {
    id: string;
    name: string | null;
    email: string | null;
    /** Roles derived from the `user_roles` junction table */
    roles: string[];
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

    /**
     * Fetches all profiles and joins each user's roles from `user_roles`.
     * `profiles` table: id, name, email (no role/roles columns).
     */
    const fetchProfiles = useCallback(async () => {
        setLoading(true);

        // 1. Fetch all profiles
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, name, email')
            .order('name', { ascending: true });

        if (profileError) {
            console.error('Error fetching profiles:', profileError);
            setLoading(false);
            return;
        }

        // 2. Fetch all user_roles in one query
        const { data: rolesData, error: rolesError } = await supabase
            .from('user_roles')
            .select('user_id, role');

        if (rolesError) {
            console.error('Error fetching user_roles:', rolesError);
        }

        // 3. Build a map of user_id → roles[]
        const rolesMap = new Map<string, string[]>();
        (rolesData ?? []).forEach((r: any) => {
            const existing = rolesMap.get(r.user_id) ?? [];
            rolesMap.set(r.user_id, [...existing, r.role]);
        });

        // 4. Merge into profile objects
        const merged: Profile[] = (profileData ?? []).map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            roles: rolesMap.get(p.id) ?? [],
        }));

        setProfiles(merged);
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
                password: editData.password || undefined,
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
            case 'SUPER_ADMIN': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'ORG_ADMIN': return 'bg-amber-100 text-amber-700 border-amber-200';
            default: return 'bg-gray-100 text-gray-700 border-gray-200';
        }
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
                <Button
                    onClick={() => setShowCreate(true)}
                    className="text-sm font-semibold flex items-center gap-2 shadow-sm"
                >
                    <UserPlus size={16} />
                    Create User
                </Button>
            </div>

            {/* Stats — count by role from user_roles */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {AVAILABLE_ROLES.map(role => (
                    <Card key={role}>
                        <CardContent className="p-4 flex items-center gap-3">
                            <div className={`p-2 rounded-full ${getRoleBadgeColor(role).split(' ')[0]}`}>
                                <Shield size={18} className={getRoleBadgeColor(role).split(' ')[1]} />
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
                                    {profiles.filter(p => p.roles.includes(role)).length}
                                </p>
                                <p className="text-xs text-gray-500">{role}</p>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Search & Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50 gap-3">
                    <h3 className="font-semibold text-gray-900">All Users ({profiles.length})</h3>
                    <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-64 text-sm"
                    />
                </div>

                <div className="overflow-x-auto">
                    <Table className="text-sm">
                        <TableHeader className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold">
                            <TableRow>
                                <TableHead className="px-6 py-4">User</TableHead>
                                <TableHead className="px-6 py-4">Contact</TableHead>
                                <TableHead className="px-6 py-4">Roles</TableHead>
                                <TableHead className="px-6 py-4 text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="px-6 py-8 text-center text-muted-foreground italic">
                                        Loading users…
                                    </TableCell>
                                </TableRow>
                            ) : filteredProfiles.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="px-6 py-8 text-center text-muted-foreground italic">
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            ) : filteredProfiles.map(p => (
                                <TableRow key={p.id} className="hover:bg-gray-50 transition-colors">
                                    <TableCell className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-gray-900">{p.name || 'No Name'}</span>
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                <Key size={10} /> ••••••••
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-gray-600">
                                        <div className="flex items-center gap-2">
                                            <Mail size={14} className="text-gray-400" />
                                            {p.email}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4">
                                        <div className="flex flex-wrap gap-1">
                                            {p.roles.length > 0 ? p.roles.map(role => (
                                                <Badge
                                                    key={role}
                                                    variant="outline"
                                                    className={`px-2 py-0.5 text-[0.7rem] font-medium ${getRoleBadgeColor(role)}`}
                                                >
                                                    {role}
                                                </Badge>
                                            )) : (
                                                <span className="text-xs text-muted-foreground italic">No roles</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => {
                                                    setEditingProfile(p);
                                                    setEditData({
                                                        name: p.name || '',
                                                        roles: p.roles,
                                                        password: '',
                                                    });
                                                }}
                                                title="Edit User"
                                            >
                                                <Edit2 size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setDeletingId(p.id)}
                                                title="Delete User"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </div>

            {/* Create User Modal */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create New User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium block mb-1">Name</label>
                            <Input
                                placeholder="Full Name"
                                value={createData.name}
                                onChange={(e) => setCreateData({ ...createData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Email</label>
                            <Input
                                type="email"
                                placeholder="email@example.com"
                                value={createData.email}
                                onChange={(e) => setCreateData({ ...createData, email: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Password</label>
                            <Input
                                type="password"
                                placeholder="••••••••"
                                value={createData.password}
                                onChange={(e) => setCreateData({ ...createData, password: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Roles</label>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_ROLES.map((role) => (
                                    <Button
                                        key={role}
                                        type="button"
                                        variant={createData.roles.includes(role) ? 'default' : 'outline'}
                                        size="sm"
                                        className="rounded-full text-xs"
                                        onClick={() => {
                                            const newRoles = createData.roles.includes(role)
                                                ? createData.roles.filter((r) => r !== role)
                                                : [...createData.roles, role];
                                            if (newRoles.length > 0) setCreateData({ ...createData, roles: newRoles });
                                        }}
                                    >
                                        {role}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowCreate(false)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleCreate}
                            disabled={processing}
                            className="flex-1"
                        >
                            {processing ? 'Creating...' : 'Create User'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Edit User Modal */}
            <Dialog open={!!editingProfile} onOpenChange={(open) => !open && setEditingProfile(null)}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit User</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <label className="text-sm font-medium block mb-1">Name</label>
                            <Input
                                value={editData.name}
                                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium block mb-1">Reset Password (Optional)</label>
                            <Input
                                type="password"
                                placeholder="Leave blank to keep current"
                                value={editData.password}
                                onChange={(e) => setEditData({ ...editData, password: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Roles</label>
                            <div className="flex flex-wrap gap-2">
                                {AVAILABLE_ROLES.map((role) => (
                                    <Button
                                        key={role}
                                        type="button"
                                        variant={editData.roles.includes(role) ? 'default' : 'outline'}
                                        size="sm"
                                        className="rounded-full text-xs"
                                        onClick={() => {
                                            const newRoles = editData.roles.includes(role)
                                                ? editData.roles.filter((r) => r !== role)
                                                : [...editData.roles, role];
                                            if (newRoles.length > 0) setEditData({ ...editData, roles: newRoles });
                                        }}
                                    >
                                        {role}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <DialogFooter className="pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setEditingProfile(null)}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleUpdate}
                            disabled={processing}
                            className="flex-1"
                        >
                            {processing ? 'Saving...' : 'Save Changes'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation */}
            <Dialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
                <DialogContent className="max-w-md">
                    <div className="space-y-4 text-center">
                        <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-2">
                            <Trash2 className="text-red-600" size={24} />
                        </div>
                        <DialogHeader className="space-y-1">
                            <DialogTitle>Delete User?</DialogTitle>
                        </DialogHeader>
                        <p className="text-gray-600">
                            This action cannot be undone. The user will lose access immediately.
                        </p>
                        <DialogFooter className="flex gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDeletingId(null)}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={processing}
                                className="flex-1"
                            >
                                {processing ? 'Deleting...' : 'Delete User'}
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
