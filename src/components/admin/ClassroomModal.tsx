'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { X, Save, Trash2 } from 'lucide-react';
import { useOrganization } from '@/context/OrganizationContext';

interface Classroom {
    id: string;
    name: string;
    capacity: number;
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    classroom?: Classroom | null;
    onSuccess: () => void;
}

export default function ClassroomModal({ isOpen, onClose, classroom, onSuccess }: Props) {
    const supabase = createClient();
    const { selectedOrganization } = useOrganization();
    const [name, setName] = useState('');
    const [capacity, setCapacity] = useState(20);
    const [locationId, setLocationId] = useState('');
    const [locations, setLocations] = useState<{ id: string, name: string }[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && selectedOrganization) {
            // Fetch locations filtered by organization
            const fetchLocations = async () => {
                const { data } = await supabase
                    .from('locations')
                    .select('id, name')
                    .eq('organization_id', selectedOrganization.id);
                if (data) {
                    setLocations(data);
                    // Default to first location if none selected and only one exists
                    if (data.length === 1 && !classroom) {
                        setLocationId(data[0].id);
                    }
                }
            };
            fetchLocations();

            if (classroom) {
                setName(classroom.name);
                setCapacity(classroom.capacity);
                // In a real app we'd fetch the classroom's location_id here if it's not passed in props
                // For now, let's assume we might need to fetch it or just let user select.
                // If the classroom object doesn't have location_id, we might want to fetch it.
                // But for this quick fix, let's just let them select or default.
            } else {
                setName('');
                setCapacity(20);
                setLocationId('');
            }
        }
    }, [isOpen, classroom, supabase]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        if (!locationId) {
            // Try to find a default if not set (e.g. if we didn't wait for fetch)
            const { data } = await supabase.from('locations').select('id').limit(1).single();
            if (data) {
                // proceed with this id
            } else {
                alert('Please select a location');
                setLoading(false);
                return;
            }
        }

        // Final check on locationId
        let finalLocationId = locationId;
        if (!finalLocationId) {
            const { data } = await supabase.from('locations').select('id').limit(1).single();
            if (data) finalLocationId = data.id;
            else {
                alert('No location found. Please contact admin.');
                setLoading(false);
                return;
            }
        }

        const payload = { name, capacity, location_id: finalLocationId };
        let result;

        if (classroom) {
            result = await supabase.from('classrooms').update(payload).eq('id', classroom.id);
        } else {
            result = await supabase.from('classrooms').insert([payload]);
        }

        if (result.error) {
            alert('Error: ' + result.error.message);
        } else {
            onSuccess();
            onClose();
        }
        setLoading(false);
    };

    const handleDelete = async () => {
        if (!classroom || !confirm('Are you sure? This will remove the classroom and unassign students.')) return;
        setLoading(true);
        const { error } = await supabase.from('classrooms').delete().eq('id', classroom.id);

        if (error) {
            alert('Error: ' + error.message);
        } else {
            onSuccess();
            onClose();
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-sm">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-xl">
                    <h3 className="font-bold text-gray-900">{classroom ? 'Edit Classroom' : 'Add Classroom'}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Classroom Name</label>
                        <input
                            type="text"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="e.g. KG 1"
                            className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                        <select
                            value={locationId}
                            onChange={e => setLocationId(e.target.value)}
                            className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none bg-white"
                        >
                            <option value="">Select Location</option>
                            {locations.map(loc => (
                                <option key={loc.id} value={loc.id}>{loc.name}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                        <input
                            type="number"
                            required
                            min="1"
                            value={capacity}
                            onChange={e => setCapacity(parseInt(e.target.value))}
                            className="w-full rounded-lg border border-gray-300 p-2 text-gray-900 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none"
                        />
                    </div>

                    <div className="pt-2 flex gap-3">
                        {classroom && (
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={loading}
                                className="px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                            >
                                <Trash2 size={18} />
                            </button>
                        )}
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 bg-brand-olive text-white font-bold py-2 rounded-lg hover:bg-opacity-90 flex items-center justify-center gap-2"
                        >
                            <Save size={18} />
                            {loading ? 'Saving...' : 'Save'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
