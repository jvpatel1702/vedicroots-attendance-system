'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useOrganization } from '@/context/OrganizationContext';
import { Loader2, Plus, Search, Calendar, Check, X, Clock } from 'lucide-react';
import { clockIn, clockOut } from '@/lib/actions/staff-attendance';

export default function StaffAttendancePage() {
    const supabase = createClient();
    const { selectedOrganization } = useOrganization();

    // State
    const [loading, setLoading] = useState(true);
    const [staff, setStaff] = useState<any[]>([]);
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [searchTerm, setSearchTerm] = useState('');
    const [attendanceMap, setAttendanceMap] = useState<Record<string, any>>({});

    // Actions State
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        if (selectedOrganization) {
            fetchData();
        }
    }, [selectedOrganization, date]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Fetch all active staff for org
            // Staff are linked to persons who have org_id
            const { data: staffData, error: staffError } = await supabase
                .from('staff')
                .select(`
                    id, 
                    role,
                    persons!inner (
                        id, first_name, last_name, organization_id
                    )
                `)
                .eq('is_active', true)
                .eq('persons.organization_id', selectedOrganization?.id);

            if (staffError) throw staffError;

            // 2. Fetch attendance for date
            const { data: attendanceData, error: attendanceError } = await supabase
                .from('staff_attendance')
                .select('*')
                .eq('date', date);

            // Note: We should filter attendance by staff IDs we just fetched 
            // but for simplicity fetching by date is okay unless huge volume.
            // Or better: filter by date AND staff_id in (staffIds)

            if (attendanceError) throw attendanceError;

            // Map attendance by staff_id
            const map: Record<string, any> = {};
            attendanceData?.forEach((r: any) => {
                map[r.staff_id] = r;
            });

            setStaff(staffData || []);
            setAttendanceMap(map);

        } catch (err: any) {
            console.error(err);
            alert('Error fetching data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleManualClockIn = async (staffId: string) => {
        if (!confirm('Manually clock in this staff member for ' + date + '?')) return;

        setActionLoading(staffId);
        // Note: The server action assumes "today". 
        // If 'date' !== today, we might need a different action or update the action to accept date.
        // For now, assuming "Daily Tasks" implies managing Today.
        // If viewing past, we probably shouldn't allow simple clock-in button, but an "Edit" or "Add Record" modal.

        if (date !== new Date().toISOString().split('T')[0]) {
            alert("Can only fast-clock-in for today. Use 'Add Record' for past dates (not implemented yet).");
            setActionLoading(null);
            return;
        }

        const res = await clockIn(staffId);
        if (res.success) {
            await fetchData();
        } else {
            alert(res.message);
        }
        setActionLoading(null);
    };

    const handleManualClockOut = async (staffId: string) => {
        if (!confirm('Clock out this staff member?')) return;

        setActionLoading(staffId);
        const res = await clockOut(staffId);
        if (res.success) {
            await fetchData();
        } else {
            alert(res.message);
        }
        setActionLoading(null);
    };

    // Filter staff
    const filteredStaff = staff.filter(s => {
        const fullName = `${s.persons.first_name} ${s.persons.last_name}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
    });

    // Sort: Present first, then Absent
    filteredStaff.sort((a, b) => {
        const aStatus = attendanceMap[a.id]?.check_in ? 1 : 0;
        const bStatus = attendanceMap[b.id]?.check_in ? 1 : 0;
        return bStatus - aStatus; // Descending (Present at top)
    });

    if (!selectedOrganization) return <div className="p-8">Please select an organization.</div>;

    return (
        <div className="p-6 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Staff Attendance</h1>
                    <p className="text-gray-500">Daily overview of staff presence</p>
                </div>

                <div className="flex items-center gap-3 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
                    <Calendar size={18} className="text-gray-400" />
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="outline-none text-sm text-gray-700 font-medium"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-brand-olive focus:border-transparent outline-none"
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="flex items-center gap-2 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-medium border border-green-100">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span>
                            Present: {staff.filter(s => attendanceMap[s.id]?.check_in).length}
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-gray-50 text-gray-600 rounded-full text-xs font-medium border border-gray-200">
                            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                            Absent: {staff.length - staff.filter(s => attendanceMap[s.id]?.check_in).length}
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Staff Member</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Role</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Clock In</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Clock Out</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider">Work Duration</th>
                                <th className="px-6 py-4 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        <Loader2 className="animate-spin mx-auto mb-2" />
                                        Loading attendance data...
                                    </td>
                                </tr>
                            ) : filteredStaff.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                                        No staff members found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredStaff.map(s => {
                                    const record = attendanceMap[s.id];
                                    const isPresent = !!record?.check_in;
                                    const isCompleted = !!record?.check_out;

                                    return (
                                        <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isPresent ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                                                        {s.persons.first_name[0]}{s.persons.last_name[0]}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium text-gray-900">{s.persons.first_name} {s.persons.last_name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-100 text-gray-600 border border-gray-200">
                                                    {s.role}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isCompleted ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                        <Check size={12} /> Shift Done
                                                    </span>
                                                ) : isPresent ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-50 text-green-700 border border-green-100">
                                                        <Clock size={12} /> Working
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-500 border border-gray-200">
                                                        Absent
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                                                {record?.check_in ? new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600 font-mono">
                                                {record?.check_out ? new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {record?.work_minutes ? (
                                                    <span>
                                                        {Math.floor(record.work_minutes / 60)}h {record.work_minutes % 60}m
                                                        {record.break_deducted && <span className="text-xs text-amber-600 ml-1" title="30 min break deducted">(-30m)</span>}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {!isPresent ? (
                                                    <button
                                                        onClick={() => handleManualClockIn(s.id)}
                                                        disabled={!!actionLoading}
                                                        className="text-xs font-medium text-brand-olive hover:text-brand-dark px-3 py-1.5 bg-brand-olive/10 rounded-md hover:bg-brand-olive/20 transition-colors"
                                                    >
                                                        {actionLoading === s.id ? <Loader2 size={14} className="animate-spin" /> : 'Clock In'}
                                                    </button>
                                                ) : !isCompleted ? (
                                                    <button
                                                        onClick={() => handleManualClockOut(s.id)}
                                                        disabled={!!actionLoading}
                                                        className="text-xs font-medium text-red-600 hover:text-red-700 px-3 py-1.5 bg-red-50 rounded-md hover:bg-red-100 transition-colors"
                                                    >
                                                        {actionLoading === s.id ? <Loader2 size={14} className="animate-spin" /> : 'Clock Out'}
                                                    </button>
                                                ) : (
                                                    <button className="text-xs text-gray-400 cursor-not-allowed">
                                                        Edit (Soon)
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
