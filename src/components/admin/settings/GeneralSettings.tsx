'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabaseClient';
import { Save } from 'lucide-react';
import { useOrganization } from '@/context/OrganizationContext';

export default function GeneralSettings() {
    const supabase = createClient();
    const { selectedOrganization } = useOrganization();
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    // Track program IDs so we can upsert by (program_id, organization_id)
    const [kgProgramId, setKgProgramId] = useState<string | null>(null);
    const [elemProgramId, setElemProgramId] = useState<string | null>(null);

    // Check if this is a daycare organization
    const isDaycare = selectedOrganization?.type?.toLowerCase() === 'daycare';

    // --- School Settings State ---
    const [cutoffTimeKg, setCutoffTimeKg] = useState('09:15');
    const [cutoffTimeElementary, setCutoffTimeElementary] = useState('09:00');
    const [dropoffTimeKg, setDropoffTimeKg] = useState('08:45');
    const [dropoffTimeElementary, setDropoffTimeElementary] = useState('08:15');
    const [pickupTimeKg, setPickupTimeKg] = useState('15:30');
    const [pickupTimeElementary, setPickupTimeElementary] = useState('15:15');
    const [extendedCareRate, setExtendedCareRate] = useState('80.00');

    // --- Daycare Settings State ---
    const [openTime, setOpenTime] = useState('07:30');
    const [closeTime, setCloseTime] = useState('18:00');
    const [latePickupFee, setLatePickupFee] = useState('5.00');

    useEffect(() => {
        if (selectedOrganization) {
            fetchSettings();
        }
    }, [selectedOrganization]);

    const fetchSettings = async () => {
        if (!selectedOrganization) return;
        setLoading(true);

        // Fetch all programs for this org
        const { data: programs } = await supabase
            .from('programs')
            .select('id, name')
            .eq('organization_id', selectedOrganization.id);

        if (!programs || programs.length === 0) { setLoading(false); return; }

        // Identify KG vs Elementary programs by name convention
        const kgProg = programs.find(p => /kindergarten|\bkg\b/i.test(p.name));
        const elemProg = programs.find(p => !/kindergarten|\bkg\b/i.test(p.name));
        const daycareProgram = isDaycare ? programs[0] : null;

        if (kgProg) setKgProgramId(kgProg.id);
        if (elemProg) setElemProgramId(elemProg.id);

        // Fetch settings for all programs in this org
        const { data: settingsRows } = await supabase
            .from('program_settings')
            .select('*')
            .eq('organization_id', selectedOrganization.id);

        if (!settingsRows) { setLoading(false); return; }

        if (isDaycare && daycareProgram) {
            const s = settingsRows.find(r => r.program_id === daycareProgram.id);
            if (s) {
                if (s.open_time) setOpenTime(s.open_time.slice(0, 5));
                if (s.close_time) setCloseTime(s.close_time.slice(0, 5));
                if (s.late_pickup_fee) setLatePickupFee(s.late_pickup_fee.toString());
            }
        } else {
            const kgS = kgProg ? settingsRows.find(r => r.program_id === kgProg.id) : null;
            const elemS = elemProg ? settingsRows.find(r => r.program_id === elemProg.id) : null;

            if (kgS) {
                if (kgS.cutoff_time) setCutoffTimeKg(kgS.cutoff_time.slice(0, 5));
                if (kgS.dropoff_time) setDropoffTimeKg(kgS.dropoff_time.slice(0, 5));
                if (kgS.pickup_time) setPickupTimeKg(kgS.pickup_time.slice(0, 5));
            }
            if (elemS) {
                if (elemS.cutoff_time) setCutoffTimeElementary(elemS.cutoff_time.slice(0, 5));
                if (elemS.dropoff_time) setDropoffTimeElementary(elemS.dropoff_time.slice(0, 5));
                if (elemS.pickup_time) setPickupTimeElementary(elemS.pickup_time.slice(0, 5));
            }
            // Extended care rate is shared across programs — take from whichever row has it
            const anyS = kgS || elemS;
            if (anyS?.extended_care_rate_monthly) setExtendedCareRate(anyS.extended_care_rate_monthly.toString());
            if (anyS?.open_time) setOpenTime(anyS.open_time.slice(0, 5));
            if (anyS?.close_time) setCloseTime(anyS.close_time.slice(0, 5));
            if (anyS?.late_pickup_fee) setLatePickupFee(anyS.late_pickup_fee.toString());
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!selectedOrganization) return;
        setSaving(true);

        const orgId = selectedOrganization.id;
        const errors: string[] = [];

        // Helper: upsert a single program's settings row
        const upsertProgram = async (programId: string, payload: Record<string, unknown>) => {
            const { error } = await supabase
                .from('program_settings')
                .upsert(
                    { program_id: programId, organization_id: orgId, ...payload },
                    { onConflict: 'program_id,organization_id' }
                );
            if (error) errors.push(error.message);
        };

        if (isDaycare) {
            // Daycare: single program with open/close/late_pickup_fee
            const progId = kgProgramId || elemProgramId;
            if (progId) await upsertProgram(progId, {
                open_time: openTime,
                close_time: closeTime,
                late_pickup_fee: parseFloat(latePickupFee),
            });
        } else {
            // School: KG program → KG times, Elementary → Elementary times
            const sharedRate = parseFloat(extendedCareRate);
            if (kgProgramId) await upsertProgram(kgProgramId, {
                cutoff_time: cutoffTimeKg,
                dropoff_time: dropoffTimeKg,
                pickup_time: pickupTimeKg,
                extended_care_rate_monthly: sharedRate,
                open_time: openTime,
                close_time: closeTime,
                late_pickup_fee: parseFloat(latePickupFee),
            });
            if (elemProgramId) await upsertProgram(elemProgramId, {
                cutoff_time: cutoffTimeElementary,
                dropoff_time: dropoffTimeElementary,
                pickup_time: pickupTimeElementary,
                extended_care_rate_monthly: sharedRate,
                open_time: openTime,
                close_time: closeTime,
                late_pickup_fee: parseFloat(latePickupFee),
            });
        }

        if (errors.length > 0) {
            alert('Error saving settings:\n' + errors.join('\n'));
        } else {
            alert('Settings saved successfully!');
        }
        setSaving(false);
    };

    if (!selectedOrganization) {
        return (
            <Card className="max-w-2xl">
                <CardContent className="py-8 text-center text-gray-500">
                    Please select an organization first.
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="max-w-2xl">
            <CardHeader className="pb-4 border-b border-gray-100">
                <CardTitle>General Configuration</CardTitle>
                <CardDescription>
                    Manage attendance rules for <span className="font-semibold">{selectedOrganization.name}</span>
                    {isDaycare && <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Daycare</span>}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                {loading ? (
                    <div className="text-gray-500">Loading settings...</div>
                ) : (
                    <>
                        {isDaycare ? (
                            /* === DAYCARE SETTINGS === */
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Operating Hours</h3>
                                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-purple-800 mb-1">Open Time</label>
                                                <input
                                                    type="time"
                                                    value={openTime}
                                                    onChange={(e) => setOpenTime(e.target.value)}
                                                    className="w-full rounded-md border border-purple-300 p-2 text-sm text-gray-900 focus:ring-1 focus:ring-purple-500 outline-none bg-white"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-purple-800 mb-1">Close Time</label>
                                                <input
                                                    type="time"
                                                    value={closeTime}
                                                    onChange={(e) => setCloseTime(e.target.value)}
                                                    className="w-full rounded-md border border-purple-300 p-2 text-sm text-gray-900 focus:ring-1 focus:ring-purple-500 outline-none bg-white"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2 border-t border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Late Pickup Fee</h3>
                                    <div className="max-w-xs">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Fee per minute after close
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={latePickupFee}
                                                onChange={(e) => setLatePickupFee(e.target.value)}
                                                className="w-full pl-7 pr-4 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Charged per minute for pickups after {closeTime || '6:00 PM'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* === SCHOOL SETTINGS === */
                            <div className="space-y-6">
                                <div>
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Attendance & Pickup Times</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* KG Section */}
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="bg-blue-100 p-1.5 rounded text-blue-700">
                                                    <span className="text-xs font-bold">KG</span>
                                                </div>
                                                <label className="text-sm font-semibold text-blue-900">
                                                    Kindergarten (JK/SK)
                                                </label>
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-blue-800 mb-1">Regular Drop-off Time</label>
                                                    <input
                                                        type="time"
                                                        value={dropoffTimeKg}
                                                        onChange={(e) => setDropoffTimeKg(e.target.value)}
                                                        className="w-full rounded-md border border-blue-300 p-2 text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-blue-800 mb-1">Morning Cutoff (Late)</label>
                                                    <input
                                                        type="time"
                                                        value={cutoffTimeKg}
                                                        onChange={(e) => setCutoffTimeKg(e.target.value)}
                                                        className="w-full rounded-md border border-blue-300 p-2 text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-blue-800 mb-1">Regular Pickup Time (Latest)</label>
                                                    <input
                                                        type="time"
                                                        value={pickupTimeKg}
                                                        onChange={(e) => setPickupTimeKg(e.target.value)}
                                                        className="w-full rounded-md border border-blue-300 p-2 text-sm text-gray-900 focus:ring-1 focus:ring-blue-500 outline-none bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Elementary Section */}
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <div className="bg-green-100 p-1.5 rounded text-green-700">
                                                    <span className="text-xs font-bold">EL</span>
                                                </div>
                                                <label className="text-sm font-semibold text-green-900">
                                                    Elementary (Grade 1+)
                                                </label>
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="block text-xs font-medium text-green-800 mb-1">Regular Drop-off Time</label>
                                                    <input
                                                        type="time"
                                                        value={dropoffTimeElementary}
                                                        onChange={(e) => setDropoffTimeElementary(e.target.value)}
                                                        className="w-full rounded-md border border-green-300 p-2 text-sm text-gray-900 focus:ring-1 focus:ring-green-500 outline-none bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-green-800 mb-1">Morning Cutoff (Late)</label>
                                                    <input
                                                        type="time"
                                                        value={cutoffTimeElementary}
                                                        onChange={(e) => setCutoffTimeElementary(e.target.value)}
                                                        className="w-full rounded-md border border-green-300 p-2 text-sm text-gray-900 focus:ring-1 focus:ring-green-500 outline-none bg-white"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-medium text-green-800 mb-1">Regular Pickup Time (Latest)</label>
                                                    <input
                                                        type="time"
                                                        value={pickupTimeElementary}
                                                        onChange={(e) => setPickupTimeElementary(e.target.value)}
                                                        className="w-full rounded-md border border-green-300 p-2 text-sm text-gray-900 focus:ring-1 focus:ring-green-500 outline-none bg-white"
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Extended Care Fee Section */}
                                <div className="pt-2 border-t border-gray-100">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-3">Extended Care Pricing</h3>
                                    <div className="max-w-xs">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Monthly Rate (per 30min cycle)
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-2 text-gray-500">$</span>
                                            <input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={extendedCareRate}
                                                onChange={(e) => setExtendedCareRate(e.target.value)}
                                                className="w-full pl-7 pr-4 py-2 rounded-lg border border-gray-300 text-gray-900 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none"
                                            />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Base rate for one 30-min cycle per month (calculated for 5 days/week). Pro-rated based on days selected.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="pt-4 flex justify-end">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="bg-brand-olive text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-opacity-90 shadow-sm transition-all"
                            >
                                <Save size={18} />
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
