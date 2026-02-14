'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useOrganization } from '@/context/OrganizationContext';
import { createUser } from '@/app/actions/users';
import { X, Save, UserPlus, Key } from 'lucide-react';

interface Props {
    teacher?: {
        id: string;
        name: string;
        email: string;
        role?: string; // Added role
        user_id?: string | null;
    } | null; // If passed, editing mode
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Classroom {
    id: string;
    name: string;
}

export default function StaffForm({ teacher, isOpen, onClose, onSuccess }: Props) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('TEACHER');

    // User Creation State
    const [createLogin, setCreateLogin] = useState(false);
    const [password, setPassword] = useState('');

    const [locations, setLocations] = useState<{ id: string, name: string }[]>([]);
    const { selectedOrganization } = useOrganization();

    // Hierarchy State
    const [selectedOrgId, setSelectedOrgId] = useState('');
    const [selectedLocationId, setSelectedLocationId] = useState('');
    const [classroomId, setClassroomId] = useState(''); // Primary assignment
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);

    useEffect(() => {
        if (isOpen && selectedOrganization) {
            // Set Org from Context
            setSelectedOrgId(selectedOrganization.id);

            if (teacher) {
                setName(teacher.name);
                setEmail(teacher.email);
                setRole(teacher.role || 'TEACHER');
                setCreateLogin(false); // Don't create login in edit mode by default
                setPassword('');
            } else {
                setName('');
                setEmail('');
                setRole('TEACHER');
                setCreateLogin(true);
                setPassword('');
                setSelectedLocationId('');
                setClassroomId('');
            }
        }
    }, [isOpen, teacher, selectedOrganization]);

    // Fetch Locations when Org changes (which is set from context)
    useEffect(() => {
        if (!selectedOrgId) {
            setLocations([]);
            setSelectedLocationId('');
            return;
        }
        const fetchLocations = async () => {
            const { data } = await supabase
                .from('locations')
                .select('id, name')
                .eq('organization_id', selectedOrgId)
                .order('name');
            if (data) setLocations(data);
        };
        fetchLocations();
    }, [selectedOrgId, supabase]);

    // Fetch Classrooms when Location changes
    useEffect(() => {
        if (!selectedLocationId) {
            setClassrooms([]);
            setClassroomId('');
            return;
        }
        const fetchClassrooms = async () => {
            const { data } = await supabase
                .from('classrooms')
                .select('id, name')
                .eq('location_id', selectedLocationId)
                .order('name');
            if (data) setClassrooms(data);
        };
        fetchClassrooms();
    }, [selectedLocationId, supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const personPayload = {
            first_name: name.split(' ')[0],
            last_name: name.split(' ').slice(1).join(' ') || '.',
            email: email,
            organization_id: selectedOrgId // Link person to Org
        };

        // Validate Org Selection
        if (!selectedOrgId) {
            alert('Please select an Organization.');
            setLoading(false);
            return;
        }

        let userId: string | null = null;

        // 1. Create Auth User if requested
        if (createLogin && password && (!teacher || !teacher.user_id)) {
            try {
                const result = await createUser({
                    email,
                    password,
                    name,
                    roles: [role]
                });
                if (result.success && result.user) {
                    userId = result.user.id;
                }
            } catch (authErr: any) {
                alert('Error creating user login: ' + authErr.message);
                setLoading(false);
                return;
            }
        }

        let personId;
        let staffId = teacher?.id;
        let err;

        if (teacher) {
            // EDIT MODE
            const { data: staffData } = await supabase.from('staff').select('person_id').eq('id', teacher.id).single();

            if (staffData?.person_id) {
                const { error: pErr } = await supabase.from('persons').update(personPayload).eq('id', staffData.person_id);
                if (pErr) {
                    err = pErr;
                } else {
                    const updateData: any = { email, role: role as any };
                    if (userId) updateData.user_id = userId;

                    const { error: sErr } = await supabase.from('staff').update(updateData).eq('id', teacher.id);
                    err = sErr;
                }
            } else {
                err = new Error("Could not find linked person record.");
            }
        } else {
            // CREATE MODE
            const { data: personData, error: pErr } = await supabase.from('persons').insert([personPayload]).select().single();
            if (pErr) {
                err = pErr;
            } else if (personData) {
                personId = personData.id;
                const { data: staffData, error: sErr } = await supabase.from('staff').insert([{
                    person_id: personId,
                    role: role, // 'TEACHER', 'ADMIN', 'OFFICE'
                    email: email,
                    is_active: true,
                    user_id: userId // Link to Auth User
                }]).select().single();

                if (sErr) err = sErr;
                if (staffData) staffId = staffData.id;
            }
        }

        if (err) {
            alert('Error saving staff: ' + err.message);
            setLoading(false);
            return;
        }

        // Handle Classroom Assignment - ONLY if role is TEACHER
        if (role === 'TEACHER' && classroomId && staffId) {
            await supabase.from('teacher_classrooms').delete().eq('staff_id', staffId);

            const { error: assignError } = await supabase.from('teacher_classrooms').insert([{
                staff_id: staffId,
                classroom_id: classroomId
            }]);

            if (assignError) alert('Error assigning class: ' + assignError.message);
        }

        onSuccess();
        onClose();
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 className="font-bold text-gray-900">{teacher ? 'Edit Staff' : 'Add Staff'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input
                            type="email"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none"
                        />
                        {!teacher && <p className="text-xs text-gray-500 mt-1">Note: This creates a profile only. User must sign up with this email.</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                        <select
                            value={role}
                            onChange={e => setRole(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none bg-white"
                        >
                            <option value="TEACHER">Teacher</option>
                            <option value="ADMIN">Admin</option>
                            <option value="OFFICE">Office Staff</option>
                        </select>
                    </div>

                    {/* Create Login User Option (Only if not already linked) */}
                    {(!teacher || !teacher.user_id) && (
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-3">
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="createLogin"
                                    checked={createLogin}
                                    onChange={e => setCreateLogin(e.target.checked)}
                                    className="rounded text-brand-olive focus:ring-brand-olive"
                                />
                                <label htmlFor="createLogin" className="text-sm font-medium text-gray-700 flex items-center gap-1 cursor-pointer">
                                    <UserPlus size={16} />
                                    {teacher ? 'Create Login for this Staff' : 'Create Login Account'}
                                </label>
                            </div>

                            {createLogin && (
                                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                    <label className="block text-xs font-medium text-gray-600 mb-1">Password</label>
                                    <div className="relative">
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={e => setPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full rounded-lg border border-gray-300 p-2 pl-8 text-sm text-gray-900 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none"
                                        />
                                        <Key size={14} className="absolute left-2.5 top-2.5 text-gray-400" />
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1">User can use this password to log in immediately.</p>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Hierarchy Selections */}
                    {/* Organization is auto-selected from context */}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <select
                            value={selectedLocationId}
                            onChange={e => setSelectedLocationId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none bg-white"
                            disabled={!selectedOrgId}
                        >
                            <option value="">Select Location</option>
                            {locations.map(l => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                    </div>

                    {role === 'TEACHER' && (
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Assign Classroom</label>
                            <select
                                value={classroomId}
                                onChange={e => setClassroomId(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none bg-white"
                                disabled={!selectedLocationId}
                            >
                                <option value="">Select Classroom</option>
                                {classrooms.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500 mt-1">Only showing classrooms at selected location.</p>
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-olive text-white font-bold py-3 rounded-lg hover:bg-opacity-90 flex items-center justify-center gap-2 transition-opacity"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Staff'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
