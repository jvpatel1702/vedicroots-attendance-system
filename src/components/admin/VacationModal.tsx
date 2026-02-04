'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { X, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    studentId: string;
    studentName: string;
}

interface Vacation {
    id: string;
    start_date: string;
    end_date: string;
    reason: string;
}

export default function VacationModal({ isOpen, onClose, studentId, studentName }: Props) {
    const supabase = createClient();
    const [vacations, setVacations] = useState<Vacation[]>([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [reason, setReason] = useState('');

    const fetchVacations = useCallback(async () => {
        if (!studentId) return;
        const { data } = await supabase
            .from('student_vacations')
            .select('*')
            .eq('student_id', studentId)
            .order('start_date');

        if (data) setVacations(data);
    }, [studentId, supabase]);

    useEffect(() => {
        if (isOpen && studentId) {
            fetchVacations();
        }
    }, [isOpen, studentId, fetchVacations]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!startDate || !endDate) return;

        setLoading(true);
        const { error } = await supabase
            .from('student_vacations')
            .insert([{
                student_id: studentId,
                start_date: startDate,
                end_date: endDate,
                reason: reason
            }]);

        if (error) {
            alert('Error adding vacation: ' + error.message);
        } else {
            setStartDate('');
            setEndDate('');
            setReason('');
            fetchVacations();
        }
        setLoading(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to remove this vacation?')) return;

        await supabase.from('student_vacations').delete().eq('id', id);
        fetchVacations();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-brand-cream/30 rounded-t-xl">
                    <div>
                        <h3 className="font-bold text-gray-900 border-l-4 border-brand-gold pl-2">Manage Vacations</h3>
                        <p className="text-xs text-brand-dark/60 pl-2">for {studentName}</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* List Existing */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                            <Calendar size={16} className="text-brand-olive" />
                            Scheduled Vacations
                        </h4>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto border border-gray-100">
                            {vacations.length === 0 ? (
                                <p className="text-sm text-gray-400 text-center py-2 italic">No vacations recorded.</p>
                            ) : (
                                vacations.map(v => (
                                    <div key={v.id} className="flex items-center justify-between text-sm bg-white p-2 rounded border border-gray-200 shadow-sm">
                                        <div>
                                            <span className="font-medium text-gray-800">{v.start_date}</span>
                                            <span className="text-gray-400 mx-1">to</span>
                                            <span className="font-medium text-gray-800">{v.end_date}</span>
                                            {v.reason && <p className="text-xs text-gray-500 mt-0.5">{v.reason}</p>}
                                        </div>
                                        <button
                                            onClick={() => handleDelete(v.id)}
                                            className="text-red-500 hover:text-red-700 ml-3 hover:bg-red-50 p-1 rounded"
                                            title="Delete"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Add New */}
                    <form onSubmit={handleAdd} className="border-t border-gray-100 pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3 text-brand-olive">Add New Vacation</h4>
                        <div className="grid grid-cols-2 gap-3 mb-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Start Date</label>
                                <input
                                    type="date"
                                    required
                                    value={startDate}
                                    onChange={e => setStartDate(e.target.value)}
                                    // brand focus ring
                                    className="w-full text-sm rounded-lg border border-gray-300 p-2 text-gray-900 focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">End Date</label>
                                <input
                                    type="date"
                                    required
                                    value={endDate}
                                    onChange={e => setEndDate(e.target.value)}
                                    className="w-full text-sm rounded-lg border border-gray-300 p-2 text-gray-900 focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-xs font-medium text-gray-500 mb-1">Reason (Optional)</label>
                            <input
                                type="text"
                                value={reason}
                                onChange={e => setReason(e.target.value)}
                                placeholder="e.g. Family Trip"
                                className="w-full text-sm rounded-lg border border-gray-300 p-2 text-gray-900 focus:ring-2 focus:ring-brand-gold focus:border-transparent outline-none"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "w-full text-white font-bold py-2 rounded-lg transition-colors text-sm",
                                loading ? "bg-gray-400 cursor-not-allowed" : "bg-brand-olive hover:bg-brand-olive/90"
                            )}
                        >
                            {loading ? 'Adding...' : 'Add Vacation'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
