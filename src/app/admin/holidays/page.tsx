'use client';

import { useState, useEffect, useCallback } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import { getHolidays, saveHoliday, deleteHoliday } from '@/lib/actions/holidays';
import { SchoolHoliday } from '@/lib/classroomUtils';
import { Calendar, Plus, Trash2, Edit2, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';

export default function HolidaysPage() {
    const { selectedOrganization } = useOrganization();
    const [holidays, setHolidays] = useState<SchoolHoliday[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState<SchoolHoliday | null>(null);

    // Form state
    const [name, setName] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [isSaving, setIsSaving] = useState(false);

    const fetchHolidays = useCallback(async () => {
        if (!selectedOrganization) return;
        setLoading(true);
        try {
            const data = await getHolidays(selectedOrganization.id);
            setHolidays(data);
        } catch (error) {
            console.error('Failed to fetch holidays:', error);
        } finally {
            setLoading(false);
        }
    }, [selectedOrganization]);

    useEffect(() => {
        fetchHolidays();
    }, [fetchHolidays]);

    const handleOpenModal = (holiday?: SchoolHoliday) => {
        if (holiday) {
            setEditingHoliday(holiday);
            setName(holiday.name);
            setStartDate(holiday.start_date);
            setEndDate(holiday.end_date);
        } else {
            setEditingHoliday(null);
            setName('');
            setStartDate('');
            setEndDate('');
        }
        setIsModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedOrganization) return;

        setIsSaving(true);
        try {
            await saveHoliday({
                id: editingHoliday?.id,
                organization_id: selectedOrganization.id,
                name,
                start_date: startDate,
                end_date: endDate || startDate
            });
            setIsModalOpen(false);
            fetchHolidays();
        } catch (error) {
            console.error('Failed to save holiday:', error);
            alert('Failed to save holiday. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this holiday?')) return;

        try {
            await deleteHoliday(id);
            fetchHolidays();
        } catch (error) {
            console.error('Failed to delete holiday:', error);
            alert('Failed to delete holiday.');
        }
    };

    if (!selectedOrganization) return <div className="p-8 text-center text-gray-500">Please select an organization.</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 font-serif">School Holidays</h2>
                    <p className="text-gray-500 text-sm">Manage scheduled breaks and public holidays.</p>
                </div>
                <Button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 bg-brand-olive hover:bg-brand-olive/90"
                >
                    <Plus size={18} />
                    Add Holiday
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {loading ? (
                    <div className="flex justify-center p-12 text-brand-olive">
                        <Loader2 className="animate-spin h-8 w-8" />
                    </div>
                ) : holidays.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <Calendar size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No holidays found for this organization.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {holidays.map(holiday => (
                            <div key={holiday.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-brand-cream rounded-lg text-brand-olive">
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">{holiday.name}</p>
                                        <div className="flex items-center gap-2 text-sm text-gray-600">
                                            <span>{format(parseISO(holiday.start_date), 'PPP')}</span>
                                            {holiday.start_date !== holiday.end_date && (
                                                <>
                                                    <span className="text-gray-400">→</span>
                                                    <span>{format(parseISO(holiday.end_date), 'PPP')}</span>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleOpenModal(holiday)}
                                        className="p-2 text-gray-400 hover:text-brand-olive hover:bg-brand-cream rounded-full transition-all"
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(holiday.id!)}
                                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50" onClick={() => setIsModalOpen(false)} />
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md relative z-10 overflow-hidden">
                        <div className="p-6 border-b border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">
                                {editingHoliday ? 'Edit Holiday' : 'Add New Holiday'}
                            </h3>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-semibold text-gray-700">Holiday Name</label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Christmas Break"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-gold outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">Start Date</label>
                                    <input
                                        type="date"
                                        required
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-gold outline-none"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-sm font-semibold text-gray-700">End Date (Optional)</label>
                                    <input
                                        type="date"
                                        value={endDate}
                                        onChange={e => setEndDate(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-gold outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-start gap-3 p-3 bg-amber-50 rounded-lg text-amber-800 text-xs">
                                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                                <p>Holidays will automatically disable attendance marking and affect fee proration for these dates.</p>
                            </div>

                            <div className="pt-4 flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1 bg-brand-olive"
                                    disabled={isSaving}
                                >
                                    {isSaving ? <Loader2 className="animate-spin" /> : editingHoliday ? 'Update' : 'Save'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
