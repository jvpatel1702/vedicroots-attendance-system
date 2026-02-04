'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { X, Calendar } from 'lucide-react';

interface Vacation {
    id: string;
    start_date: string;
    end_date: string;
    reason?: string;
}

interface Props {
    studentId: string;
    studentName: string;
    isOpen: boolean;
    onClose: () => void;
}

export default function VacationModal({ studentId, studentName, isOpen, onClose }: Props) {
    const supabase = createClient();
    const [vacations, setVacations] = useState<Vacation[]>([]);
    const [newStart, setNewStart] = useState('');
    const [newEnd, setNewEnd] = useState('');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen && studentId) {
            fetchVacations();
        }
    }, [isOpen, studentId]);

    const fetchVacations = async () => {
        const { data } = await supabase
            .from('student_vacations')
            .select('*')
            .eq('student_id', studentId)
            .order('start_date', { ascending: false });

        if (data) setVacations(data);
    };

    const addVacation = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase
            .from('student_vacations')
            .insert([{
                student_id: studentId,
                start_date: newStart,
                end_date: newEnd,
                reason
            }]);

        if (error) {
            alert('Error adding vacation: ' + error.message);
        } else {
            setNewStart('');
            setNewEnd('');
            setReason('');
            fetchVacations();
        }
        setLoading(false);
    };

    const deleteVacation = async (id: string) => {
        await supabase.from('student_vacations').delete().eq('id', id);
        fetchVacations();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h3 className="font-bold text-gray-900">Manage Vacations for {studentName}</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* Add Form */}
                    <form onSubmit={addVacation} className="space-y-4 p-4 bg-brand-cream/30 rounded-lg border border-brand-cream">
                        <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                            <Calendar size={16} /> Add New Vacation
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    value={newStart}
                                    onChange={e => setNewStart(e.target.value)}
                                    className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:ring-2 focus:ring-brand-olive outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
                                <input
                                    type="date"
                                    required
                                    value={newEnd}
                                    onChange={e => setNewEnd(e.target.value)}
                                    className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:ring-2 focus:ring-brand-olive outline-none"
                                />
                            </div>
                        </div>
                        <div>
                            <input
                                type="text"
                                placeholder="Reason (Optional)"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                className="w-full rounded-md border border-gray-300 p-2 text-sm text-gray-900 focus:ring-2 focus:ring-brand-olive outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-brand-olive text-white text-sm font-medium py-2 rounded-md hover:bg-opacity-90 disabled:opacity-50 transition-opacity"
                        >
                            {loading ? 'Adding...' : 'Add Vacation'}
                        </button>
                    </form>

                    {/* List */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Existing Vacations</h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {vacations.length > 0 ? vacations.map(v => (
                                <div key={v.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 text-sm">
                                    <div>
                                        <p className="font-medium text-gray-800">{v.start_date} to {v.end_date}</p>
                                        {v.reason && <p className="text-gray-500 text-xs">{v.reason}</p>}
                                    </div>
                                    <button
                                        onClick={() => deleteVacation(v.id)}
                                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                                    >
                                        Remove
                                    </button>
                                </div>
                            )) : (
                                <p className="text-gray-400 text-sm italic">No vacations recorded.</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
