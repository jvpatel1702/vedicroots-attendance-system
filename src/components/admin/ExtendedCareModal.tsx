'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { X, Calculator, AlertCircle, CheckCircle, Calendar, Clock } from 'lucide-react';
import { calculateExtendedCareFee, saveExtendedCareEnrollment } from '@/app/actions/extendedCare';
import { useOrganization } from '@/context/OrganizationContext';
import { format, startOfMonth } from 'date-fns';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function ExtendedCareModal({ isOpen, onClose, onSuccess }: Props) {
    const supabase = createClient();
    const { selectedOrganization } = useOrganization();

    // Form State
    const [loading, setLoading] = useState(false);
    const [calcLoading, setCalcLoading] = useState(false);

    const [studentId, setStudentId] = useState('');
    const [selectedStudentName, setSelectedStudentName] = useState('');
    const [month, setMonth] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    // Schedule
    const [selectedDays, setSelectedDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    const [dropOffTime, setDropOffTime] = useState('07:00');
    const [pickupTime, setPickupTime] = useState('18:00');
    const [transportMode, setTransportMode] = useState('PARENT');

    // Financials
    const [manualAdjustment, setManualAdjustment] = useState(0);
    const [manualReason, setManualReason] = useState('');
    const [calculation, setCalculation] = useState<any>(null);

    // Data
    const [students, setStudents] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const searchRef = useRef<HTMLDivElement>(null);

    // Close search on click outside
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setStudents([]);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Student Search Debounce
    useEffect(() => {
        if (isOpen && selectedOrganization && searchTerm && searchTerm !== selectedStudentName) {
            const search = async () => {
                if (searchTerm.length < 2) return;

                const { data } = await supabase
                    .from('students')
                    .select(`
                        id, student_number,
                        person:persons!inner(first_name, last_name, photo_url, organization_id)
                    `)
                    .eq('person.organization_id', selectedOrganization.id)
                    .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%`, { foreignTable: 'person' })
                    .limit(10);

                if (data) {
                    const mapped = data.map((s: any) => ({
                        id: s.id,
                        first_name: s.person.first_name,
                        last_name: s.person.last_name,
                        student_number: s.student_number
                    }));
                    setStudents(mapped);
                }
            };
            const timer = setTimeout(search, 300);
            return () => clearTimeout(timer);
        } else {
            setStudents([]);
        }
    }, [searchTerm, isOpen, selectedOrganization, selectedStudentName]);

    // Auto-Calculate Effect
    useEffect(() => {
        if (studentId && selectedOrganization) {
            const timer = setTimeout(() => {
                handleCalculate();
            }, 800); // 800ms debounce for auto-calc
            return () => clearTimeout(timer);
        }
    }, [studentId, month, startDate, dropOffTime, pickupTime, selectedDays, transportMode, manualAdjustment]);

    // Initial Start Date Sync
    useEffect(() => {
        // Default startDate to first of selected month if it's in future? 
        // Or just keep today if it's current month?
        // Let's just default startDate to the month start if month changes?
        // User might want to start mid-month.
        if (month) {
            // If month is future, start date = 1st.
            // If month is current, start date = today?
            // Let's leave it manual but default to 1st of month when month changes
            setStartDate(month);
        }
    }, [month]);

    const handleCalculate = async () => {
        if (!studentId || !selectedOrganization) return;
        setCalcLoading(true);
        try {
            const result = await calculateExtendedCareFee({
                studentId,
                organizationId: selectedOrganization.id,
                month,
                startDate,
                dropOffTime,
                pickupTime,
                selectedDays,
                transportMode,
                manualAdjustment
            });
            setCalculation(result);
        } catch (error) {
            console.error(error);
            // Don't alert on auto-calc, just log
        }
        setCalcLoading(false);
    };

    const handleSave = async () => {
        if (!studentId || !selectedOrganization) return;
        setLoading(true);
        try {
            await saveExtendedCareEnrollment({
                studentId,
                organizationId: selectedOrganization.id,
                month,
                startDate,
                dropOffTime,
                pickupTime,
                selectedDays,
                transportMode,
                manualAdjustment,
                manualAdjustmentReason: manualReason
            });
            onSuccess();
            onClose();
        } catch (error) {
            console.error(error);
            alert('Error saving enrollment');
        }
        setLoading(false);
    };

    const toggleDay = (day: string) => {
        if (selectedDays.includes(day)) {
            setSelectedDays(selectedDays.filter(d => d !== day));
        } else {
            setSelectedDays([...selectedDays, day]);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto flex flex-col animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 z-10">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">Extended Care Enrollment</h3>
                        <p className="text-sm text-gray-500">Register student for paid before/after care</p>
                    </div>
                    <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto">
                    <div className="flex flex-col md:flex-row h-full">
                        {/* LEFT COLUMN: Inputs */}
                        <div className="p-6 space-y-6 w-full md:w-1/2 border-r border-gray-100">

                            {/* Student Search */}
                            <div className="relative" ref={searchRef}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Student</label>
                                <input
                                    type="text"
                                    value={searchTerm}
                                    placeholder="Search student by name..."
                                    className="w-full border rounded-lg p-2.5 focus:ring-2 focus:ring-brand-olive outline-none"
                                    onChange={e => { setSearchTerm(e.target.value); setStudentId(''); setSelectedStudentName(''); }}
                                />
                                {students.length > 0 && !studentId && (
                                    <div className="absolute top-full left-0 w-full bg-white border border-gray-200 rounded-lg shadow-xl mt-1 z-50 max-h-60 overflow-y-auto">
                                        {students.map(s => (
                                            <div
                                                key={s.id}
                                                className="p-3 hover:bg-gray-50 cursor-pointer flex justify-between items-center border-b last:border-0"
                                                onClick={() => {
                                                    setStudentId(s.id);
                                                    setSelectedStudentName(`${s.first_name} ${s.last_name}`);
                                                    setSearchTerm(`${s.first_name} ${s.last_name}`);
                                                    setStudents([]);
                                                }}
                                            >
                                                <span className="font-medium text-gray-900">{s.first_name} {s.last_name}</span>
                                                <span className="text-xs text-gray-400">{s.student_number}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Billing Month</label>
                                    <input
                                        type="date"
                                        value={month}
                                        onChange={e => setMonth(e.target.value)}
                                        className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-olive"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                                    <input
                                        type="date"
                                        value={startDate}
                                        onChange={e => setStartDate(e.target.value)}
                                        className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-olive"
                                    />
                                    <p className="text-[10px] text-gray-400 mt-1">For proration</p>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Days of Week</label>
                                <div className="flex gap-2 flex-wrap">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                                        <button
                                            key={day}
                                            onClick={() => toggleDay(day)}
                                            className={`
                                                px-3 py-2 rounded-lg text-sm font-medium transition-all
                                                ${selectedDays.includes(day)
                                                    ? 'bg-brand-olive text-white shadow-md'
                                                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}
                                            `}
                                        >
                                            {day}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Drop-off</label>
                                    <input
                                        type="time"
                                        value={dropOffTime}
                                        onChange={e => setDropOffTime(e.target.value)}
                                        className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-olive"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pickup</label>
                                    <input
                                        type="time"
                                        value={pickupTime}
                                        onChange={e => setPickupTime(e.target.value)}
                                        className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-olive"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Transport Mode</label>
                                <select
                                    value={transportMode}
                                    onChange={e => setTransportMode(e.target.value)}
                                    className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-olive"
                                >
                                    <option value="PARENT">Parent Pickup</option>
                                    <option value="TAXI">Taxi Service</option>
                                    <option value="BUS">Bus Service</option>
                                </select>
                                {transportMode === 'TAXI' && (
                                    <p className="text-xs text-brand-gold mt-1 font-medium flex items-center gap-1">
                                        <AlertCircle size={12} /> Taxi enrolled: Free until 4:30 PM
                                    </p>
                                )}
                            </div>

                        </div>

                        {/* RIGHT COLUMN: Preview & Calculation */}
                        <div className="p-6 w-full md:w-1/2 bg-gray-50/50">
                            {calcLoading && (
                                <div className="h-full flex items-center justify-center text-gray-400">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-olive"></div>
                                </div>
                            )}

                            {!calcLoading && calculation && (
                                <div className="space-y-6 animate-in fade-in duration-300">

                                    {/* Activities Section */}
                                    {calculation.activities && calculation.activities.length > 0 && (
                                        <div className="bg-white p-4 rounded-xl border border-gray-200">
                                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
                                                <Calendar size={14} /> Enrolled Activities
                                            </h4>
                                            <div className="space-y-2">
                                                {calculation.activities.map((act: any) => (
                                                    <div key={act.id} className="flex items-center justify-between text-sm p-2 bg-gray-50 rounded-lg">
                                                        <div>
                                                            <div className="font-semibold text-gray-900">{act.name}</div>
                                                            <div className="text-xs text-gray-500">{act.day} • {act.startTime?.slice(0, 5)} - {act.endTime?.slice(0, 5)}</div>
                                                        </div>
                                                        {act.isSibling && <span className="text-[10px] bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">Sibling</span>}
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[10px] text-green-600 mt-2 flex items-center gap-1">
                                                <CheckCircle size={10} /> Deductions applied for overlaps
                                            </p>
                                        </div>
                                    )}

                                    <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                                        <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                            <Calculator size={18} className="text-brand-olive" />
                                            Fee Breakdown
                                        </h4>

                                        <div className="space-y-3 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Daily Cycles (AM+PM)</span>
                                                <span className="font-mono text-gray-900">{calculation.breakdown.dailyBaseCycles.toFixed(1)}</span>
                                            </div>

                                            {calculation.breakdown.prorationFactor < 1 && (
                                                <div className="flex justify-between text-orange-600">
                                                    <span>Proration (Start {format(new Date(startDate), 'MMM d')})</span>
                                                    <span className="font-mono">{(calculation.breakdown.prorationFactor * 100).toFixed(0)}%</span>
                                                </div>
                                            )}

                                            <div className="flex justify-between pt-2 border-t border-gray-100 font-semibold">
                                                <span className="text-gray-900">Base Fee (Prorated)</span>
                                                <span className="font-mono text-gray-900">${calculation.breakdown.grossFee.toFixed(2)}</span>
                                            </div>

                                            {calculation.breakdown.deductions.map((d: any, i: number) => (
                                                <div key={i} className="flex justify-between text-green-600">
                                                    <span>Deduction ({d.reason})</span>
                                                    <span className="font-mono">-${d.amount.toFixed(2)}</span>
                                                </div>
                                            ))}

                                            <div className="pt-4 border-t border-gray-100">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-xs font-bold text-gray-500 uppercase">Manual Adjustment</span>
                                                    <input
                                                        type="number"
                                                        value={manualAdjustment}
                                                        onChange={e => setManualAdjustment(Number(e.target.value))}
                                                        className="w-24 text-right border rounded p-1 text-sm font-mono outline-none focus:border-brand-olive"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                                <div className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={manualReason}
                                                        onChange={e => setManualReason(e.target.value)}
                                                        placeholder="Reason (e.g. Late Fee, Discount)"
                                                        className="flex-1 border rounded p-1.5 text-xs outline-none focus:border-brand-olive"
                                                    />
                                                </div>
                                                <p className="text-[10px] text-gray-400 mt-1 text-right">
                                                    Negative (-) to reduce fee, Positive (+) to increase.
                                                </p>
                                            </div>

                                            <div className="flex justify-between items-center pt-4 border-t-2 border-brand-olive/20 mt-2">
                                                <span className="text-lg font-bold text-brand-dark">Final Fee</span>
                                                <span className="text-3xl font-black text-brand-olive">
                                                    ${calculation.finalFee.toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {!calcLoading && !calculation && (
                                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                                    <Clock size={48} className="mb-4 text-gray-200" />
                                    <p>Select a student to calculate fees</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 bg-gray-50 border-t border-gray-100 flex justify-end gap-3 sticky bottom-0 z-10 rounded-b-2xl">
                    <button onClick={onClose} className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg font-medium transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={loading || !calculation || !studentId}
                        className="px-6 py-2 bg-brand-olive text-white rounded-lg hover:bg-opacity-90 font-bold shadow-lg shadow-brand-olive/20 flex items-center gap-2 disabled:opacity-50 disabled:shadow-none transition-all"
                    >
                        {loading ? 'Saving...' : (
                            <>
                                <CheckCircle size={18} />
                                Confirm Enrollment
                            </>
                        )}
                    </button>
                </div>

            </div>
        </div>
    );
}
