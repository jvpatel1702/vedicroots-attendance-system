'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useOrganization } from '@/context/OrganizationContext';
import { Loader2, Plus, Calendar, Check, Lock, AlertTriangle } from 'lucide-react';
import { createPayPeriods, getPayPeriods } from '@/lib/actions/pay-periods';

export default function PayPeriodsPage() {
    const { selectedOrganization } = useOrganization();

    const [periods, setPeriods] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);

    useEffect(() => {
        if (selectedOrganization) {
            fetchPeriods();
        }
    }, [selectedOrganization]);

    const fetchPeriods = async () => {
        setLoading(true);
        if (!selectedOrganization) return;

        const res = await getPayPeriods(selectedOrganization.id);
        if (res.success) {
            setPeriods(res.data || []);
        } else {
            alert('Error fetching periods: ' + res.error);
        }
        setLoading(false);
    };

    const handleGenerate = async () => {
        if (!selectedOrganization) return;
        const year = new Date().getFullYear(); // Or prompt logic

        if (!confirm(`Generate Weekly Pay Periods for ${year}? This will create periods starting Jan 1st.`)) return;

        setGenerating(true);
        const res = await createPayPeriods(selectedOrganization.id, year, 'WEEKLY');

        if (res.success) {
            alert(res.message);
            fetchPeriods();
        } else {
            alert('Error: ' + res.message);
        }
        setGenerating(false);
    };

    // Close/Lock logic could go here (calling another server action)

    if (!selectedOrganization) return <div className="p-8">Please select an organization.</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Pay Periods</h1>
                    <p className="text-gray-500">Manage payroll cycles</p>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={generating || periods.length > 0} // Disable if already exists
                    className="bg-brand-olive text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {generating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                    Generate for {new Date().getFullYear()}
                </button>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Period Name</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Start Date</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">End Date</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {loading ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    <Loader2 className="animate-spin mx-auto mb-2" />
                                    Loading...
                                </td>
                            </tr>
                        ) : periods.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                    No pay periods found. Generate them to get started.
                                </td>
                            </tr>
                        ) : (
                            periods.map(p => {
                                const isOpen = p.status === 'OPEN';
                                const isCurrent = new Date() >= new Date(p.start_date) && new Date() <= new Date(p.end_date);

                                return (
                                    <tr key={p.id} className={isCurrent ? 'bg-indigo-50/50' : ''}>
                                        <td className="px-6 py-4 font-medium text-gray-900 flex items-center gap-2">
                                            {p.name}
                                            {isCurrent && <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">Current</span>}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{new Date(p.start_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4 text-gray-600 font-mono text-sm">{new Date(p.end_date).toLocaleDateString()}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${isOpen ? 'bg-green-50 text-green-700 border border-green-100' : 'bg-gray-100 text-gray-600 border border-gray-200'}`}>
                                                {isOpen ? 'Open' : 'Closed'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-xs text-brand-dark hover:underline">View Report</button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
