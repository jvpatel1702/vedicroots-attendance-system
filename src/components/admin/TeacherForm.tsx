'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { X, Save } from 'lucide-react';

interface Props {
    teacher?: {
        id: string;
        name: string;
        email: string;
    } | null; // If passed, editing mode
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

interface Classroom {
    id: string;
    name: string;
}

export default function TeacherForm({ teacher, isOpen, onClose, onSuccess }: Props) {
    const supabase = createClient();
    const [loading, setLoading] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [locations, setLocations] = useState<{ id: string, name: string }[]>([]);
    const [organizations, setOrganizations] = useState<{ id: string, name: string }[]>([]);

    // Hierarchy State
    const [selectedOrgId, setSelectedOrgId] = useState('');
    const [selectedLocationId, setSelectedLocationId] = useState('');
    const [classroomId, setClassroomId] = useState(''); // Primary assignment
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);

    useEffect(() => {
        // Fetch Organizations on load
        const fetchOrgs = async () => {
            const { data } = await supabase.from('organizations').select('id, name').order('name');
            if (data) setOrganizations(data);
        };
        fetchOrgs();

        if (isOpen) {
            if (teacher) {
                setName(teacher.name);
                setEmail(teacher.email);
                // TODO: In edit mode, we should ideally pre-fill Org/Location based on checking existing assignments.
                // For now, simpler to leave empty or just load teacher details.
                // Creating a proper "Edit Assignment" flow might be a separate task, 
                // but let's at least clear the selections to avoid invalid states.
            } else {
                setName('');
                setEmail('');
                setSelectedOrgId('');
                setSelectedLocationId('');
                setClassroomId('');
            }
        }
    }, [isOpen, teacher, supabase]);

    // Fetch Locations when Org changes
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
                    const { error: sErr } = await supabase.from('staff').update({ email, role: 'TEACHER' }).eq('id', teacher.id);
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
                    role: 'TEACHER',
                    email: email,
                    is_active: true
                }]).select().single();

                if (sErr) err = sErr;
                if (staffData) staffId = staffData.id;
            }
        }

        if (err) {
            alert('Error saving teacher: ' + err.message);
            setLoading(false);
            return;
        }

        // Handle Classroom Assignment
        if (classroomId && staffId) {
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
                    <h3 className="font-bold text-gray-900">{teacher ? 'Edit Teacher' : 'Add Teacher'}</h3>
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

                    {/* Hierarchy Selections */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Organization</label>
                        <select
                            value={selectedOrgId}
                            onChange={e => setSelectedOrgId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none bg-white"
                            required={!teacher} // Required for new teachers
                        >
                            <option value="">Select Organization</option>
                            {organizations.map(o => (
                                <option key={o.id} value={o.id}>{o.name}</option>
                            ))}
                        </select>
                    </div>

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

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-olive text-white font-bold py-3 rounded-lg hover:bg-opacity-90 flex items-center justify-center gap-2 transition-opacity"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save Teacher'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
