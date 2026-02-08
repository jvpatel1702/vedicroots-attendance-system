'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabaseClient';
import { Plus, MapPin, Trash2 } from 'lucide-react';
import { useOrganization } from '@/context/OrganizationContext';

interface Location {
    id: string;
    name: string;
    address: string;
    capacity: number;
}

export default function LocationsManagement() {
    const supabase = createClient();
    const { selectedOrganization } = useOrganization();
    const [locations, setLocations] = useState<Location[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [newLocation, setNewLocation] = useState({
        name: '',
        address: '',
        capacity: ''
    });

    useEffect(() => {
        if (selectedOrganization) {
            fetchLocations();
        }
    }, [selectedOrganization]);

    const fetchLocations = async () => {
        if (!selectedOrganization) return;
        const { data } = await supabase.from('locations').select('*').eq('organization_id', selectedOrganization.id).order('name');
        if (data) setLocations(data);
        setLoading(false);
    };

    const handleAdd = async () => {
        if (!selectedOrganization) return alert('Please select an organization first');
        if (!newLocation.name) return alert('Name is required');

        const { error } = await supabase.from('locations').insert([{
            name: newLocation.name,
            address: newLocation.address,
            capacity: newLocation.capacity ? parseInt(newLocation.capacity) : null,
            organization_id: selectedOrganization.id
        }]);

        if (error) alert('Error: ' + error.message);
        else {
            setNewLocation({ name: '', address: '', capacity: '' });
            setIsAdding(false);
            fetchLocations();
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this location? This will delete all classrooms associated with it.')) {
            const { error } = await supabase.from('locations').delete().eq('id', id);
            if (error) alert('Error: ' + error.message);
            else fetchLocations();
        }
    };

    return (
        <Card className="max-w-4xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
                <div>
                    <CardTitle>Locations Management</CardTitle>
                    <CardDescription>Manage physical campuses and their addresses.</CardDescription>
                </div>
                <button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-indigo-50 text-indigo-600 p-2 rounded-full hover:bg-indigo-100 transition-colors"
                >
                    <Plus size={20} />
                </button>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                {isAdding && (
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in flex flex-col gap-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                                <label className="text-xs font-bold text-gray-500 ml-1">Location Name</label>
                                <input
                                    placeholder="e.g. Main Campus"
                                    value={newLocation.name}
                                    onChange={e => setNewLocation({ ...newLocation, name: e.target.value })}
                                    className="w-full border p-2 rounded-lg text-sm mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 ml-1">Address</label>
                                <input
                                    placeholder="123 School St"
                                    value={newLocation.address}
                                    onChange={e => setNewLocation({ ...newLocation, address: e.target.value })}
                                    className="w-full border p-2 rounded-lg text-sm mt-1"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 ml-1">Capacity</label>
                                <input
                                    type="number"
                                    placeholder="Optional"
                                    value={newLocation.capacity}
                                    onChange={e => setNewLocation({ ...newLocation, capacity: e.target.value })}
                                    className="w-full border p-2 rounded-lg text-sm mt-1"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                            <button onClick={() => setIsAdding(false)} className="px-3 py-2 text-gray-500 text-sm">Cancel</button>
                            <button onClick={handleAdd} className="px-4 py-2 bg-brand-olive text-white rounded-lg text-sm font-bold">Save Location</button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-gray-500">Loading locations...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {locations.map(loc => (
                            <div key={loc.id} className="p-4 bg-white border border-gray-100 rounded-xl hover:shadow-md transition-shadow relative group">
                                <div className="flex items-start gap-3">
                                    <div className="bg-blue-50 text-blue-600 p-2.5 rounded-lg">
                                        <MapPin size={24} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900">{loc.name}</h4>
                                        <p className="text-sm text-gray-500 line-clamp-1">{loc.address || 'No address set'}</p>
                                        {loc.capacity && <p className="text-xs text-gray-400 mt-1">Capacity: {loc.capacity}</p>}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(loc.id)}
                                    className="absolute top-4 right-4 text-gray-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
