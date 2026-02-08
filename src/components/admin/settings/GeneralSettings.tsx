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
    const [settingsId, setSettingsId] = useState<string | null>(null);

    // Form State - Separate cutoff times for Kindergarten and Elementary
    const [cutoffTimeKg, setCutoffTimeKg] = useState('09:15');
    const [cutoffTimeElementary, setCutoffTimeElementary] = useState('09:00');

    // Extended Care & Regular Times
    const [dropoffTimeKg, setDropoffTimeKg] = useState('08:45');
    const [dropoffTimeElementary, setDropoffTimeElementary] = useState('08:15');
    const [pickupTimeKg, setPickupTimeKg] = useState('15:30');
    const [pickupTimeElementary, setPickupTimeElementary] = useState('15:15');
    const [extendedCareRate, setExtendedCareRate] = useState('80.00');

    useEffect(() => {
        if (selectedOrganization) {
            fetchSettings();
        }
    }, [selectedOrganization]);

    const fetchSettings = async () => {
        if (!selectedOrganization) return;

        setLoading(true);
        const { data } = await supabase
            .from('school_settings')
            .select('*')
            .eq('organization_id', selectedOrganization.id)
            .single();

        if (data) {
            setSettingsId(data.id);
            if (data.cutoff_time_kg) {
                setCutoffTimeKg(data.cutoff_time_kg.slice(0, 5));
            } else if (data.cutoff_time) {
                setCutoffTimeKg(data.cutoff_time.slice(0, 5));
            }
            if (data.cutoff_time_elementary) {
                setCutoffTimeElementary(data.cutoff_time_elementary.slice(0, 5));
            } else if (data.cutoff_time) {
                setCutoffTimeElementary(data.cutoff_time.slice(0, 5));
            }
            if (data.dropoff_time_kg) setDropoffTimeKg(data.dropoff_time_kg.slice(0, 5));
            if (data.dropoff_time_elementary) setDropoffTimeElementary(data.dropoff_time_elementary.slice(0, 5));
            if (data.pickup_time_kg) setPickupTimeKg(data.pickup_time_kg.slice(0, 5));
            if (data.pickup_time_elementary) setPickupTimeElementary(data.pickup_time_elementary.slice(0, 5));
            if (data.extended_care_rate_monthly) setExtendedCareRate(data.extended_care_rate_monthly.toString());
        }
        setLoading(false);
    };

    const handleSave = async () => {
        if (!selectedOrganization) return;

        setSaving(true);
        const payload = {
            organization_id: selectedOrganization.id,
            cutoff_time_kg: cutoffTimeKg,
            cutoff_time_elementary: cutoffTimeElementary,
            dropoff_time_kg: dropoffTimeKg,
            dropoff_time_elementary: dropoffTimeElementary,
            pickup_time_kg: pickupTimeKg,
            pickup_time_elementary: pickupTimeElementary,
            extended_care_rate_monthly: parseFloat(extendedCareRate)
        };

        let result;
        if (settingsId) {
            result = await supabase.from('school_settings').update(payload).eq('id', settingsId);
        } else {
            result = await supabase.from('school_settings').insert([payload]).select().single();
            if (result.data) setSettingsId(result.data.id);
        }

        if (result.error) {
            alert('Error saving settings: ' + result.error.message);
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
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
                {loading ? (
                    <div className="text-gray-500">Loading settings...</div>
                ) : (
                    <>
                        {/* Cutoff Times & Extended Care Section */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-sm font-semibold text-gray-900 mb-3">Attendance & Pickup Times</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

