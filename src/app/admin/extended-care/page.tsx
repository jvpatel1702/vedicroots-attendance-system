'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useOrganization } from '@/context/OrganizationContext';
import { format, startOfMonth, parseISO } from 'date-fns';
import { Plus, Timer, Calendar, DollarSign, Search } from 'lucide-react';
import ExtendedCareModal from '@/components/admin/ExtendedCareModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ExtendedCarePage() {
    const supabase = createClient();
    const { selectedOrganization } = useOrganization();

    const [month, setMonth] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [enrollments, setEnrollments] = useState<any[]>([]); // TODO: Type this
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (selectedOrganization && month) {
            fetchEnrollments();
        }
    }, [selectedOrganization, month]);

    const fetchEnrollments = async () => {
        setLoading(true);
        // Date handling: 'month' is yyyy-MM-dd (first day)

        const { data, error } = await supabase
            .from('extended_care_enrollments')
            .select(`
                *,
                student:students(
                    first_name, last_name, student_number,
                    enrollments(grade:grades(name))
                )
            `)
            .eq('month', month)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching enrollments:', error);
        } else {
            setEnrollments(data || []);
        }
        setLoading(false);
    };

    const filteredEnrollments = enrollments.filter(e =>
        e.student.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.student.last_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const totalRevenue = enrollments.reduce((sum, e) => sum + (e.final_fee || 0), 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Timer className="text-brand-olive" />
                        Extended Care Management
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Manage paid before/after school care services.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Calendar className="absolute left-3 top-2.5 text-gray-400" size={16} />
                        <input
                            type="month"
                            value={month.slice(0, 7)} // yyyy-MM
                            onChange={(e) => setMonth(`${e.target.value}-01`)}
                            className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-brand-olive"
                        />
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-brand-olive text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-opacity-90 flex items-center gap-2 shadow-sm"
                    >
                        <Plus size={16} />
                        Add Enrollment
                    </button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-blue-50 text-blue-600 rounded-full">
                            <Timer size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Students</p>
                            <h3 className="text-2xl font-bold text-gray-900">{enrollments.length}</h3>
                            <p className="text-xs text-gray-400">for {format(parseISO(month), 'MMMM yyyy')}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-6 flex items-center gap-4">
                        <div className="p-3 bg-green-50 text-green-600 rounded-full">
                            <DollarSign size={24} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Projected Revenue</p>
                            <h3 className="text-2xl font-bold text-gray-900">${totalRevenue.toFixed(2)}</h3>
                            <p className="text-xs text-gray-400">based on current enrollments</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50/50">
                    <h3 className="font-semibold text-gray-900">Enrolled Students</h3>
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
                                <th className="px-6 py-4">Schedule</th>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Days</th>
                                <th className="px-6 py-4 text-right">Fee</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">Loading data...</td>
                                </tr>
                            ) : filteredEnrollments.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No enrollments found for this month.</td>
                                </tr>
                            ) : (
                                filteredEnrollments.map((e) => (
                                    <tr key={e.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-gray-900">{e.student.first_name} {e.student.last_name}</p>
                                                <p className="text-xs text-gray-500">{e.student.student_number || 'No ID'}</p>
                                                {e.start_date && e.start_date !== month && (
                                                    <p className="text-[10px] text-orange-600 font-medium mt-1">
                                                        Starts: {format(parseISO(e.start_date), 'MMM d')}
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded w-fit">
                                                    Drop: {e.drop_off_time?.slice(0, 5)}
                                                </span>
                                                <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded w-fit">
                                                    Pick: {e.pickup_time?.slice(0, 5)}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {/* Days Display */}
                                            <div className="flex gap-1">
                                                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(day => (
                                                    <span
                                                        key={day}
                                                        className={`text-[10px] w-6 h-6 flex items-center justify-center rounded-full 
                                                            ${(e.days_of_week || []).includes(day)
                                                                ? 'bg-brand-olive text-white font-bold'
                                                                : 'bg-gray-100 text-gray-400'}`}
                                                    >
                                                        {day[0]}
                                                    </span>
                                                ))}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-gray-500 font-medium">
                                                {e.days_of_week?.length || 0} days/wk
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right font-bold text-gray-900">
                                            ${e.final_fee.toFixed(2)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ExtendedCareModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={fetchEnrollments}
            />
        </div>
    );
}
