'use client';

import { useState, useEffect } from 'react';
import { clockIn, clockOut, getTodayStatus } from '@/lib/actions/staff-attendance';
import { Loader2, MapPin, Clock } from 'lucide-react';

interface Props {
    staffId: string;
}

export default function ClockInWidget({ staffId }: Props) {
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'LOADING' | 'ABSENT' | 'PRESENT'>('LOADING');
    const [record, setRecord] = useState<any>(null);
    const [locationError, setLocationError] = useState('');

    useEffect(() => {
        checkStatus();
    }, [staffId]);

    const checkStatus = async () => {
        // Just client-side fetching for now, could be passed as prop
        // But since it's a widget, self-contained is nice
        // ideally this is server component fetching, but for interactivity client is fine
        // wait, I imported server action 'getTodayStatus'.
        // It's better to fetch this in the parent server component and pass it down,
        // but for now let's just fetch it here.
        // ACTUALLY, server actions can be called from client.

        // However, standard Next.js pattern: fetch data in Page (Server Component) pass to Client Component.
        // But `checkStatus` allows refreshing without page reload.

        const res = await getTodayStatus(staffId);
        if (res.success && res.record) {
            setStatus(res.record.check_out ? 'ABSENT' : 'PRESENT'); // If checked out, they are done for day? Or just currently out? 
            // If they checked out, they are technically "ABSENT" (not working), but we might want to show "Checked Out Today".
            // Let's simplify: 
            // If no record -> ABSENT (Clock In available)
            // If record && check_out == null -> PRESENT (Clock Out available)
            // If record && check_out != null -> COMPLETED (Maybe allow clock in again? For now assume 1 shift)

            if (res.record.check_out) {
                setStatus('ABSENT'); // Or 'COMPLETED'
                // implementation choice: allow multiple clock-ins?
                // DB unique constraint says (staff_id, date) unique. So only 1 per day.
                // So they cannot clock in again.
            } else {
                setStatus('PRESENT');
            }
            setRecord(res.record);
        } else {
            setStatus('ABSENT');
        }
    };

    const getLocation = (): Promise<{ lat: number, lng: number } | null> => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                setLocationError('Geolocation not supported');
                resolve(null);
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Geo error:", error);
                    setLocationError('Location access denied or failed');
                    resolve(null);
                }
            );
        });
    };

    const handleClockIn = async () => {
        setLoading(true);
        setLocationError('');

        // Optional location
        const loc = await getLocation();

        const res = await clockIn(staffId, loc || undefined);
        if (res.success) {
            await checkStatus();
        } else {
            alert(res.message);
        }
        setLoading(false);
    };

    const handleClockOut = async () => {
        setLoading(true);
        const res = await clockOut(staffId); // Location for clock out optional/not implemented yet
        if (res.success) {
            await checkStatus();
            // Force reload to update UI state if "COMPLETED" isn't fully handled by local state
            window.location.reload();
        } else {
            alert(res.message);
        }
        setLoading(false);
    };

    if (status === 'LOADING') return <div className="p-4 bg-white rounded-lg shadow animate-pulse h-32"></div>;

    const isFinished = record && record.check_out;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center justify-center space-y-4">
            <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-800">Staff Attendance</h3>
                <p className="text-sm text-gray-500">
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </p>
            </div>

            <div className={`p-4 rounded-full ${status === 'PRESENT' ? 'bg-green-50' : isFinished ? 'bg-gray-50' : 'bg-blue-50'}`}>
                <Clock size={32} className={status === 'PRESENT' ? 'text-green-600' : isFinished ? 'text-gray-400' : 'text-blue-600'} />
            </div>

            {isFinished ? (
                <div className="text-center">
                    <p className="text-brand-dark font-medium">Shift Completed</p>
                    <p className="text-xs text-gray-500">
                        {new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                        {new Date(record.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {record.work_minutes > 0 && (
                        <p className="text-xs text-green-600 font-medium mt-1">
                            {Math.floor(record.work_minutes / 60)}h {record.work_minutes % 60}m worked
                        </p>
                    )}
                </div>
            ) : status === 'PRESENT' ? (
                <div className="w-full">
                    <div className="text-center mb-4">
                        <p className="text-sm text-green-700 font-medium">Currently Clocked In</p>
                        <p className="text-xs text-gray-500">Since {new Date(record.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                    <button
                        onClick={handleClockOut}
                        disabled={loading}
                        className="w-full bg-red-50 text-red-600 border border-red-100 hover:bg-red-100 font-medium py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Clock Out
                    </button>
                </div>
            ) : (
                <div className="w-full space-y-2">
                    <button
                        onClick={handleClockIn}
                        disabled={loading}
                        className="w-full bg-brand-olive text-white hover:bg-opacity-90 font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
                    >
                        {loading && <Loader2 size={16} className="animate-spin" />}
                        Clock In
                    </button>
                    {locationError && (
                        <p className="text-xs text-amber-600 flex items-center gap-1 justify-center">
                            <MapPin size={10} /> Location optional or unavailable
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
