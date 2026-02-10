'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useOrganization } from '@/context/OrganizationContext';
import { Timer, DollarSign, Search, Plus, Square, Play, Users } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface Subscription {
    id: string;
    start_date: string;
    end_date: string | null;
    drop_off_time: string | null;
    pickup_time: string | null;
    days_of_week: string[] | null;
    student: {
        id: string;
        student_number: string;
        person: { first_name: string; last_name: string };
    };
}

export default function ExtendedCarePage() {
    const supabase = createClient();
    const { selectedOrganization } = useOrganization();

    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showActiveOnly, setShowActiveOnly] = useState(true);

    // Start Subscription Modal State
    const [showStartModal, setShowStartModal] = useState(false);
    const [studentSearch, setStudentSearch] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [selectedStudent, setSelectedStudent] = useState<any>(null);
    const [newSub, setNewSub] = useState({
        start_date: new Date().toISOString().split('T')[0],
        before_care: true,
        after_care: true,
        drop_off_time: '07:30',
        pickup_time: '17:00',
        days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri']
    });
    const [saving, setSaving] = useState(false);

    // Stop Subscription Modal State
    const [showStopModal, setShowStopModal] = useState(false);
    const [selectedSubToStop, setSelectedSubToStop] = useState<Subscription | null>(null);
    const [stopDate, setStopDate] = useState(new Date().toISOString().split('T')[0]);

    const fetchSubscriptions = useCallback(async () => {
        if (!selectedOrganization) return;
        setLoading(true);

        const { data, error } = await supabase
            .from('extended_care_subscriptions')
            .select(`
                id, start_date, end_date, drop_off_time, pickup_time, days_of_week,
                student:students(
                    id, student_number,
                    person:persons(first_name, last_name)
                )
            `)
            .order('start_date', { ascending: false });

        if (error) {
            console.error('Error fetching subscriptions:', error);
        } else {
            setSubscriptions((data || []) as unknown as Subscription[]);
        }
        setLoading(false);
    }, [supabase, selectedOrganization]);

    useEffect(() => {
        if (selectedOrganization) fetchSubscriptions();
    }, [selectedOrganization, fetchSubscriptions]);

    // Student Search for Modal
    useEffect(() => {
        if (!studentSearch || studentSearch.length < 2 || !selectedOrganization) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(async () => {
            const { data } = await supabase
                .from('students')
                .select(`id, student_number, person:persons!inner(first_name, last_name, organization_id)`)
                .eq('person.organization_id', selectedOrganization.id)
                .or(`first_name.ilike.%${studentSearch}%,last_name.ilike.%${studentSearch}%`, { foreignTable: 'person' })
                .limit(10);
            if (data) {
                setSearchResults(data.filter((s: any) => s.person).map((s: any) => ({
                    id: s.id,
                    student_number: s.student_number,
                    first_name: s.person.first_name,
                    last_name: s.person.last_name
                })));
            }
        }, 300);
        return () => clearTimeout(timer);
    }, [studentSearch, selectedOrganization, supabase]);

    const handleStartSubscription = async () => {
        if (!selectedStudent) return;
        if (!newSub.before_care && !newSub.after_care) {
            alert('Please select at least Before Care or After Care.');
            return;
        }
        // Check if student already has active subscription
        const existing = subscriptions.find(s => s.student.id === selectedStudent.id && !s.end_date);
        if (existing) {
            alert('This student already has an active subscription. Stop it first.');
            return;
        }
        setSaving(true);
        const { error } = await supabase.from('extended_care_subscriptions').insert({
            student_id: selectedStudent.id,
            start_date: newSub.start_date,
            drop_off_time: newSub.before_care ? newSub.drop_off_time : null,
            pickup_time: newSub.after_care ? newSub.pickup_time : null,
            days_of_week: newSub.days_of_week
        });
        if (error) alert('Error: ' + error.message);
        else {
            setShowStartModal(false);
            setSelectedStudent(null);
            setStudentSearch('');
            setNewSub({ start_date: new Date().toISOString().split('T')[0], before_care: true, after_care: true, drop_off_time: '07:30', pickup_time: '17:00', days_of_week: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] });
            fetchSubscriptions();
        }
        setSaving(false);
    };

    const handleStopSubscription = async () => {
        if (!selectedSubToStop) return;
        setSaving(true);
        const { error } = await supabase
            .from('extended_care_subscriptions')
            .update({ end_date: stopDate })
            .eq('id', selectedSubToStop.id);
        if (error) alert('Error: ' + error.message);
        else {
            setShowStopModal(false);
            setSelectedSubToStop(null);
            fetchSubscriptions();
        }
        setSaving(false);
    };

    // Filter subscriptions
    const filtered = subscriptions.filter(s => {
        const nameMatch = `${s.student.person.first_name} ${s.student.person.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
        const activeMatch = showActiveOnly ? !s.end_date : true;
        return nameMatch && activeMatch;
    });

    const activeCount = subscriptions.filter(s => !s.end_date).length;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Timer className="text-brand-olive" />
                        Extended Care Subscriptions
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Manage ongoing extended care services for students.</p>
                </div>
                <button
                    onClick={() => setShowStartModal(true)}
                    className="bg-brand-olive text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-opacity-90 flex items-center gap-2 shadow-sm"
                >
                    <Plus size={16} />
                    Start Subscription
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-full">
                            <Play size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Subscriptions</p>
                            <h3 className="text-2xl font-bold text-gray-900">{activeCount}</h3>
                            <p className="text-xs text-gray-400">currently enrolled students</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                            <Users size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Total Subscriptions</p>
                            <h3 className="text-2xl font-bold text-gray-900">{subscriptions.length}</h3>
                            <p className="text-xs text-gray-400">including past enrollments</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row justify-between items-center gap-3 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">Subscriptions</h3>
                        <label className="flex items-center gap-2 text-sm">
                            <input type="checkbox" checked={showActiveOnly} onChange={e => setShowActiveOnly(e.target.checked)} className="rounded" />
                            Active only
                        </label>
                    </div>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search students..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:border-brand-olive"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-xs text-gray-500 uppercase font-semibold">
                            <tr>
                                <th className="px-6 py-4">Student</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Period</th>
                                <th className="px-6 py-4">Schedule</th>
                                <th className="px-6 py-4">Days</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">Loading...</td></tr>
                            ) : filtered.length === 0 ? (
                                <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No subscriptions found.</td></tr>
                            ) : filtered.map(s => (
                                <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <p className="font-semibold text-gray-900">{s.student.person.first_name} {s.student.person.last_name}</p>
                                        <p className="text-xs text-gray-500">{s.student.student_number || 'No ID'}</p>
                                    </td>
                                    <td className="px-6 py-4">
                                        {!s.end_date ? (
                                            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">ACTIVE</span>
                                        ) : (
                                            <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded">ENDED</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600">
                                        {s.start_date} {s.end_date ? `→ ${s.end_date}` : '→ ongoing'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1 text-xs">
                                            {s.drop_off_time && <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded w-fit">Drop: {s.drop_off_time.slice(0, 5)}</span>}
                                            {s.pickup_time && <span className="bg-orange-50 text-orange-700 px-2 py-0.5 rounded w-fit">Pick: {s.pickup_time.slice(0, 5)}</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                                                <span key={day} className={`text-[10px] w-6 h-6 flex items-center justify-center rounded-full ${(s.days_of_week || []).includes(day) ? 'bg-brand-olive text-white font-bold' : 'bg-gray-100 text-gray-400'}`}>
                                                    {day[0]}
                                                </span>
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        {!s.end_date && (
                                            <button onClick={() => { setSelectedSubToStop(s); setShowStopModal(true); setStopDate(new Date().toISOString().split('T')[0]); }}
                                                className="text-red-600 hover:text-red-800 text-xs font-medium flex items-center gap-1 ml-auto">
                                                <Square size={14} /> Stop
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Start Subscription Modal */}
            {showStartModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 space-y-4">
                        <h3 className="text-xl font-bold text-gray-900">Start Extended Care Subscription</h3>

                        {/* Student Search */}
                        <div className="relative">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                            {selectedStudent ? (
                                <div className="flex items-center justify-between p-2 bg-green-50 border border-green-200 rounded-lg">
                                    <span className="font-medium text-green-800">{selectedStudent.first_name} {selectedStudent.last_name}</span>
                                    <button onClick={() => { setSelectedStudent(null); setStudentSearch(''); }} className="text-green-600 hover:text-green-800 text-xs">Change</button>
                                </div>
                            ) : (
                                <>
                                    <input type="text" value={studentSearch} onChange={e => setStudentSearch(e.target.value)}
                                        placeholder="Search student by name..." className="w-full border rounded-lg p-2.5" />
                                    {searchResults.length > 0 && (
                                        <div className="absolute z-10 w-full bg-white border rounded-lg shadow-lg mt-1 max-h-48 overflow-y-auto">
                                            {searchResults.map(s => (
                                                <button key={s.id} onClick={() => { setSelectedStudent(s); setStudentSearch(''); setSearchResults([]); }}
                                                    className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm">
                                                    {s.first_name} {s.last_name} <span className="text-gray-400">({s.student_number})</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </>
                            )}
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                            <input type="date" value={newSub.start_date} onChange={e => setNewSub({ ...newSub, start_date: e.target.value })}
                                className="border rounded-lg p-2 text-sm w-full" />
                        </div>

                        {/* Before Care Toggle */}
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => setNewSub({ ...newSub, before_care: !newSub.before_care })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${newSub.before_care ? 'bg-orange-600' : 'bg-gray-300'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newSub.before_care ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <span className="text-sm font-medium text-gray-700">Before Care (Drop-off after 7:00 AM)</span>
                            {newSub.before_care && (
                                <input type="time" value={newSub.drop_off_time} onChange={e => setNewSub({ ...newSub, drop_off_time: e.target.value })}
                                    min="07:00" className="border rounded p-2 text-sm" />
                            )}
                        </div>

                        {/* After Care Toggle */}
                        <div className="flex items-center gap-4">
                            <button type="button" onClick={() => setNewSub({ ...newSub, after_care: !newSub.after_care })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${newSub.after_care ? 'bg-orange-600' : 'bg-gray-300'}`}>
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${newSub.after_care ? 'translate-x-6' : 'translate-x-1'}`} />
                            </button>
                            <span className="text-sm font-medium text-gray-700">After Care (Pick-up before 6:00 PM)</span>
                            {newSub.after_care && (
                                <input type="time" value={newSub.pickup_time} onChange={e => setNewSub({ ...newSub, pickup_time: e.target.value })}
                                    max="18:00" className="border rounded p-2 text-sm" />
                            )}
                        </div>

                        {/* Days of Week */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Days of Week</label>
                            <div className="flex gap-2">
                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                                    <button key={day} type="button"
                                        onClick={() => {
                                            const days = newSub.days_of_week.includes(day)
                                                ? newSub.days_of_week.filter(d => d !== day)
                                                : [...newSub.days_of_week, day];
                                            setNewSub({ ...newSub, days_of_week: days });
                                        }}
                                        className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${newSub.days_of_week.includes(day) ? 'bg-orange-600 text-white' : 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50'}`}
                                    >
                                        {day}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 pt-2">
                            <button onClick={handleStartSubscription} disabled={saving || !selectedStudent}
                                className="flex-1 bg-brand-olive text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                                {saving ? 'Saving...' : 'Start Subscription'}
                            </button>
                            <button onClick={() => { setShowStartModal(false); setSelectedStudent(null); setStudentSearch(''); }}
                                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stop Subscription Modal */}
            {showStopModal && selectedSubToStop && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 space-y-4">
                        <h3 className="text-xl font-bold text-gray-900">Stop Extended Care</h3>
                        <p className="text-sm text-gray-600">
                            Stopping subscription for <strong>{selectedSubToStop.student.person.first_name} {selectedSubToStop.student.person.last_name}</strong>
                        </p>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                            <input type="date" value={stopDate} onChange={e => setStopDate(e.target.value)}
                                className="border rounded-lg p-2 text-sm w-full" />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <button onClick={handleStopSubscription} disabled={saving}
                                className="flex-1 bg-red-600 text-white py-2 rounded-lg text-sm font-semibold disabled:opacity-50">
                                {saving ? 'Stopping...' : 'Confirm Stop'}
                            </button>
                            <button onClick={() => { setShowStopModal(false); setSelectedSubToStop(null); }}
                                className="flex-1 border border-gray-300 py-2 rounded-lg text-sm">Cancel</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
