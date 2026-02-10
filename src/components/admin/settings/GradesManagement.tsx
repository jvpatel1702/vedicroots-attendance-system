'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabaseClient';
import { Plus, Trash2, Edit2, Check, X, ArrowUp, ArrowDown } from 'lucide-react';
import { useOrganization } from '@/context/OrganizationContext';

interface Grade {
    id: string;
    name: string;
    order: number;
    organization_id?: string;
}

export default function GradesManagement() {
    const supabase = createClient();
    const { selectedOrganization } = useOrganization();
    const [grades, setGrades] = useState<Grade[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [editOrder, setEditOrder] = useState('');

    const [newGrade, setNewGrade] = useState({
        name: '',
        order: ''
    });

    useEffect(() => {
        if (selectedOrganization) {
            fetchGrades();
        }
    }, [selectedOrganization]);

    const fetchGrades = async () => {
        if (!selectedOrganization) return;
        setLoading(true);

        // Fetch only grades for this organization (not global)
        const { data } = await supabase
            .from('grades')
            .select('*')
            .eq('organization_id', selectedOrganization.id)
            .order('order', { ascending: true });
        if (data) setGrades(data);
        setLoading(false);
    };

    const handleAdd = async () => {
        if (!newGrade.name) return alert('Please enter a grade name');
        if (!selectedOrganization) return alert('Please select an organization');

        // Auto-calculate order if not provided
        const order = newGrade.order ? parseInt(newGrade.order) : grades.length + 1;

        const { error } = await supabase.from('grades').insert([{
            name: newGrade.name,
            order: order,
            organization_id: selectedOrganization.id
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

    const startEditing = (grade: Grade) => {
        setEditingId(grade.id);
        setEditName(grade.name);
        setEditOrder(grade.order.toString());
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditName('');
        setEditOrder('');
    };

    const saveEdit = async () => {
        if (!editingId || !editName) return;

        const { error } = await supabase
            .from('grades')
            .update({ name: editName, order: parseInt(editOrder) })
            .eq('id', editingId);

        if (error) alert('Error: ' + error.message);
        else {
            cancelEditing();
            fetchGrades();
        }
    };

    const moveOrder = async (grade: Grade, direction: 'up' | 'down') => {
        const currentIndex = grades.findIndex(g => g.id === grade.id);
        const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

        if (targetIndex < 0 || targetIndex >= grades.length) return;

        const targetGrade = grades[targetIndex];

        // Swap orders
        await supabase.from('grades').update({ order: targetGrade.order }).eq('id', grade.id);
        await supabase.from('grades').update({ order: grade.order }).eq('id', targetGrade.id);

        fetchGrades();
    };

    if (!selectedOrganization) {
        return (
            <Card className="max-w-4xl">
                <CardContent className="py-8 text-center text-gray-500">
                    Please select an organization first.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-4xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-gray-100">
                <div>
                    <CardTitle>Grades Management</CardTitle>
                    <CardDescription>
                        Configure grades for <span className="font-semibold">{selectedOrganization.name}</span>
                    </CardDescription>
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
                                placeholder={`${grades.length + 1}`}
                                value={newGrade.order}
                                onChange={e => setNewGrade({ ...newGrade, order: e.target.value })}
                                className="w-full border p-2 rounded-lg text-sm mt-1"
                            />
                        </div>
                        <div className="flex gap-2 pb-0.5">
                            <button onClick={() => setIsAdding(false)} className="px-3 py-2 text-gray-500 text-sm">Cancel</button>
                            <button onClick={handleAdd} className="px-4 py-2 bg-brand-olive text-white rounded-lg text-sm font-bold">Add</button>
                        </div>
                    </div>
                )}

                {loading ? (
                    <div className="text-gray-500">Loading grades...</div>
                ) : grades.length === 0 ? (
                    <div className="text-gray-500 text-center py-8">
                        No grades configured for this organization. Click + to add one.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {grades.map((grade, index) => (
                            <div key={grade.id} className="flex items-center justify-between p-3 bg-white border border-gray-100 rounded-lg hover:border-gray-300 transition-colors group">
                                {editingId === grade.id ? (
                                    // Edit mode
                                    <div className="flex items-center gap-3 flex-1">
                                        <input
                                            type="number"
                                            value={editOrder}
                                            onChange={e => setEditOrder(e.target.value)}
                                            className="w-16 border border-gray-300 rounded p-1 text-center text-sm"
                                        />
                                        <input
                                            type="text"
                                            value={editName}
                                            onChange={e => setEditName(e.target.value)}
                                            className="flex-1 border border-gray-300 rounded p-1 text-sm"
                                        />
                                        <button onClick={saveEdit} className="p-1 text-green-600 hover:bg-green-50 rounded">
                                            <Check size={18} />
                                        </button>
                                        <button onClick={cancelEditing} className="p-1 text-red-500 hover:bg-red-50 rounded">
                                            <X size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    // View mode
                                    <>
                                        <div className="flex items-center gap-4">
                                            <div className="flex flex-col gap-0.5">
                                                <button
                                                    onClick={() => moveOrder(grade, 'up')}
                                                    disabled={index === 0}
                                                    className={`p-0.5 rounded ${index === 0 ? 'text-gray-200' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                                >
                                                    <ArrowUp size={12} />
                                                </button>
                                                <button
                                                    onClick={() => moveOrder(grade, 'down')}
                                                    disabled={index === grades.length - 1}
                                                    className={`p-0.5 rounded ${index === grades.length - 1 ? 'text-gray-200' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                                                >
                                                    <ArrowDown size={12} />
                                                </button>
                                            </div>
                                            <div className="w-8 h-8 rounded-full bg-brand-olive/10 text-brand-olive flex items-center justify-center font-bold text-sm">
                                                {grade.order}
                                            </div>
                                            <span className="font-medium text-gray-700">{grade.name}</span>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => startEditing(grade)} className="text-gray-400 hover:text-indigo-600 p-2">
                                                <Edit2 size={16} />
                                            </button>
                                            <button onClick={() => handleDelete(grade.id)} className="text-gray-400 hover:text-red-500 p-2">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
