'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabaseClient';
import { Plus, Trash2, GripVertical } from 'lucide-react';

interface Grade {
    id: string;
    name: string;
    order: number;
    program_id?: string;
}

export default function GradesManagement() {
    const supabase = createClient();
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);

    const [newGrade, setNewGrade] = useState({
        name: '',
        order: ''
    });

    useEffect(() => {
        fetchGrades();
    }, []);

    const fetchGrades = async () => {
        const { data } = await supabase.from('grades').select('*').order('order', { ascending: true });
        if (data) setGrades(data);
        setLoading(false);
    };

    const handleAdd = async () => {
        if (!newGrade.name || !newGrade.order) return alert('Fill all fields');

        const { error } = await supabase.from('grades').insert([{
            name: newGrade.name,
            order: parseInt(newGrade.order)
        }]);

        if (error) alert('Error: ' + error.message);
        else {
            setNewGrade({ name: '', order: '' });
            setIsAdding(false);
            fetchGrades();
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Delete this grade? It may affect existing student records.')) {
            const { error } = await supabase.from('grades').delete().eq('id', id);
            if (error) alert('Error: ' + error.message);
            else fetchGrades();
        }
    };

    return (
        <Card className="max-w-4xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
                <div>
                    <CardTitle>Grades Management</CardTitle>
                    <CardDescription>Configure grades and their display order.</CardDescription>
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
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 animate-in fade-in flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 ml-1">Grade Name</label>
                            <input
                                placeholder="e.g. Junior Kindergarten"
                                value={newGrade.name}
                                onChange={e => setNewGrade({ ...newGrade, name: e.target.value })}
                                className="w-full border p-2 rounded-lg text-sm mt-1"
                            />
                        </div>
                        <div className="w-24">
                            <label className="text-xs font-bold text-gray-500 ml-1">Order</label>
                            <input
                                type="number"
                                placeholder="1"
                                value={newGrade.order}
                                onChange={e => setNewGrade({ ...newGrade, order: e.target.value })}
                                className="w-full border p-2 rounded-lg text-sm mt-1"
                            />
                        </div>
                        <div className="flex gap-2 pb-0.5">
                            <button onClick={() => setIsAdding(false)} className="px-3 py-2 text-gray-500 text-sm">Cancel</button>
                            <button onClick={handleAdd} className="px-4 py-2 bg-brand-olive text-white rounded-lg text-sm font-bold">Save</button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-gray-500">Loading grades...</div>
                ) : (
                    <div className="space-y-2">
                        {grades.map(grade => (
                            <div key={grade.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-300 transition-colors group">
                                <div className="flex items-center gap-4">
                                    <div className="bg-gray-50 p-2 rounded text-gray-400 cursor-move">
                                        <GripVertical size={16} />
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-brand-olive/10 text-brand-olive flex items-center justify-center font-bold text-sm">
                                        {grade.order}
                                    </div>
                                    <span className="font-medium text-gray-700">{grade.name}</span>
                                </div>
                                <button onClick={() => handleDelete(grade.id)} className="text-gray-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
