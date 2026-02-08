'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabaseClient';
import { Plus, Check, Calendar, Trash2 } from 'lucide-react';

interface AcademicYear {
    id: string;
    name: string;
    start_date: string;
    end_date: string;
    is_active: boolean;
}

export default function AcademicYears() {
    const supabase = createClient();
    const [years, setYears] = useState<AcademicYear[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    // New Year Form State
    const [newYear, setNewYear] = useState({
        name: '',
        start_date: '',
        end_date: ''
    });

    useEffect(() => {
        fetchYears();
    }, []);

    const fetchYears = async () => {
        const { data } = await supabase.from('academic_years').select('*').order('start_date', { ascending: false });
        if (data) setYears(data);
        setLoading(false);
    };

    const handleSetActive = async (id: string) => {
        // 1. Set all to inactive
        await supabase.from('academic_years').update({ is_active: false }).neq('id', '00000000-0000-0000-0000-000000000000'); // simple hack to update all, or iterating
        // Better: two queries. 
        // Supabase doesn't support bulk update with different values easily in client, 
        // but we can update ALL to false first.
        await supabase.from('academic_years').update({ is_active: false }).gt('start_date', '1900-01-01');

        // 2. Set selected to active
        const { error } = await supabase.from('academic_years').update({ is_active: true }).eq('id', id);

        if (error) alert('Error updating active year');
        fetchYears();
    };

    const handleAddYear = async () => {
        if (!newYear.name || !newYear.start_date || !newYear.end_date) {
            alert('Please fill all fields');
            return;
        }

        const { error } = await supabase.from('academic_years').insert([newYear]);
        if (error) {
            alert('Error creating year: ' + error.message);
        } else {
            setNewYear({ name: '', start_date: '', end_date: '' });
            setIsAdding(false);
            fetchYears();
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Are you sure? This might affect enrollments attached to this year.')) {
            const { error } = await supabase.from('academic_years').delete().eq('id', id);
            if (error) alert('Error deleting: ' + error.message);
            else fetchYears();
        }
    };

    return (
        <Card className="max-w-4xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
                <div>
                    <CardTitle>Academic Years</CardTitle>
                    <CardDescription>Manage enrollment years (e.g., 2025-2026).</CardDescription>
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
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in slide-in-from-top-2">
                        <h4 className="font-bold text-gray-800 mb-3 text-sm">Add New Academic Year</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
                            <input
                                placeholder="Name (e.g. 2026-2027)"
                                value={newYear.name}
                                onChange={e => setNewYear({ ...newYear, name: e.target.value })}
                                className="border p-2 rounded-lg text-sm"
                            />
                            <input
                                type="date"
                                placeholder="Start Date"
                                value={newYear.start_date}
                                onChange={e => setNewYear({ ...newYear, start_date: e.target.value })}
                                className="border p-2 rounded-lg text-sm"
                            />
                            <input
                                type="date"
                                placeholder="End Date"
                                value={newYear.end_date}
                                onChange={e => setNewYear({ ...newYear, end_date: e.target.value })}
                                className="border p-2 rounded-lg text-sm"
                            />
                        </div>
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsAdding(false)} className="text-gray-500 text-sm px-3 py-1">Cancel</button>
                            <button onClick={handleAddYear} className="bg-brand-olive text-white text-sm px-4 py-1.5 rounded-lg">Save Year</button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-8 text-gray-500">Loading years...</div>
                ) : (
                    <div className="space-y-3">
                        {years.map(year => (
                            <div
                                key={year.id}
                                className={`flex items-center justify-between p-4 rounded-xl border transition-all ${year.is_active
                                        ? 'bg-brand-olive/5 border-brand-olive shadow-sm'
                                        : 'bg-white border-gray-100 hover:border-gray-200'
                                    }`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-full ${year.is_active ? 'bg-brand-olive text-white' : 'bg-gray-100 text-gray-400'}`}>
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-gray-900 flex items-center gap-2">
                                            {year.name}
                                            {year.is_active && <span className="text-[10px] bg-brand-olive text-white px-2 py-0.5 rounded-full uppercase tracking-wide">Active</span>}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            {year.start_date} — {year.end_date}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    {!year.is_active && (
                                        <button
                                            onClick={() => handleSetActive(year.id)}
                                            className="text-sm text-gray-500 hover:text-brand-olive hover:underline"
                                        >
                                            Set Active
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleDelete(year.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors p-2"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        ))}

                        {years.length === 0 && !loading && (
                            <div className="text-center py-8 text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                No academic years found. Add one to get started.
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
