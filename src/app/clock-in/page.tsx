'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/useUser';
import { getStaffClockInStatus, clockIn } from '@/lib/actions/staff-attendance';
import { Clock, MapPin, Loader2, CheckCircle, QrCode } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { toast } from 'sonner';

export default function ClockInPage() {
    const router = useRouter();
    const { user, loading: userLoading } = useUser();
    
    const [staffId, setStaffId] = useState<string | null>(null);
    const [clockingIn, setClockingIn] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [now, setNow] = useState(new Date());
    const [activeTab, setActiveTab] = useState<'GPS' | 'QR'>('GPS');
    const [checkingStatus, setCheckingStatus] = useState(true);

    // Initial load: determine if they actually need to be here
    useEffect(() => {
        if (userLoading) return;
        if (!user?.id) {
            router.replace('/login');
            return;
        }

        getStaffClockInStatus(user.id).then((status) => {
            if (!status.hasStaffRecord) {
                // Not a staff member — shouldn't be here
                router.replace(getDashboardPath(user.roles ?? [user.role ?? '']));
                return;
            }
            if (status.isClockedIn) {
                // Already clocked in — proceed to dashboard
                router.replace(getDashboardPath(user.roles ?? [user.role ?? '']));
                return;
            }
            setStaffId(status.staffId);
            setCheckingStatus(false);
        });
    }, [user, userLoading, router]);

    // Live clock
    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // QR Scanner Lifecycle
    useEffect(() => {
        if (activeTab === 'QR' && !checkingStatus) {
            const scanner = new Html5QrcodeScanner("reader", {
                fps: 10,
                qrbox: { width: 250, height: 250 },
                aspectRatio: 1.0,
            }, false);

            scanner.render(
                async (decodedText) => {
                    // Stop scanning to prevent multiple submissions
                    scanner.clear();
                    await handleClockIn({ qrCode: decodedText });
                },
                (error) => {
                    // Ignore typical scan-frame errors
                }
            );

            return () => {
                scanner.clear().catch(console.error);
            };
        }
    }, [activeTab, checkingStatus]);

    function getDashboardPath(roles: string[]): string {
        if (roles.includes('ADMIN') || roles.includes('SUPER_ADMIN') || roles.includes('ORG_ADMIN')) return '/admin';
        if (roles.includes('TEACHER')) return '/teacher';
        if (roles.includes('OFFICE')) return '/office';
        return '/login';
    }

    const getLocation = (): Promise<{ lat: number; lng: number } | null> =>
        new Promise((resolve) => {
            if (!navigator.geolocation) { resolve(null); return; }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => { setLocationError('Location unavailable — clocking in without it.'); resolve(null); },
                { timeout: 5000 }
            );
        });

    const handleClockIn = async (opts: { qrCode?: string } = {}) => {
        if (!staffId) return;
        setClockingIn(true);
        setLocationError('');

        let lat, lng;
        if (!opts.qrCode) {
            const loc = await getLocation();
            if (loc) {
                lat = loc.lat;
                lng = loc.lng;
            }
        }

        const res = await clockIn(staffId, { lat, lng, qrCode: opts.qrCode });

        if (res.success) {
            toast.success('Clocked in successfully! Have a great shift.');
            router.replace(getDashboardPath(user?.roles ?? [user?.role ?? '']));
        } else {
            toast.error(res.message ?? 'Failed to clock in.');
            setClockingIn(false);
            if (opts.qrCode && activeTab === 'QR') {
                // Return to GPS tab if QR fails so scanner unmounts cleanly
                setActiveTab('GPS');
            }
        }
    };

    if (userLoading || checkingStatus) {
        return (
            <div className="flex items-center justify-center flex-col space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
                <p className="text-gray-500 font-medium animate-pulse">Checking your shift status...</p>
            </div>
        );
    }

    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    return (
        <div className="w-full max-w-md mx-auto relative bg-white rounded-2xl shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 px-6 py-8 text-white text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-4 shadow-inner">
                    <Clock size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-black tracking-tight">Vedic Roots</h2>
                <p className="text-indigo-200 mt-1">Please clock in to continue to your dashboard</p>
            </div>

            {/* Body */}
            <div className="px-6 py-6 space-y-6">
                
                <div className="text-center bg-gray-50 rounded-xl py-5 border border-gray-100 shadow-sm">
                    <p className="text-4xl font-mono font-bold text-gray-900 tracking-tight">{timeString}</p>
                    <p className="text-sm font-medium text-gray-500 mt-1">{dateString}</p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('GPS')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'GPS' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <MapPin size={16} /> Standard
                    </button>
                    <button
                        onClick={() => setActiveTab('QR')}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'QR' ? 'bg-white text-indigo-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        <QrCode size={16} /> QR Scan
                    </button>
                </div>

                {activeTab === 'GPS' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-left-4">
                        <p className="text-sm text-gray-500 text-center leading-relaxed px-4">
                            Your device location will be captured automatically to verify you are on site.
                        </p>
                        {locationError && (
                            <p className="text-xs text-amber-600 text-center bg-amber-50 p-2 rounded-md border border-amber-200">{locationError}</p>
                        )}
                        <button
                            onClick={() => handleClockIn()}
                            disabled={clockingIn}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 px-4 rounded-xl transition-all shadow-md shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {clockingIn ? (
                                <><Loader2 size={18} className="animate-spin" /> Clocking In...</>
                            ) : (
                                <><CheckCircle size={18} /> Clock In Now</>
                            )}
                        </button>
                    </div>
                )}

                {activeTab === 'QR' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                        <p className="text-sm text-gray-500 text-center leading-relaxed">
                            Point your camera at the school entrance QR code.
                        </p>
                        <div id="reader" className="w-full overflow-hidden rounded-xl border-2 border-dashed border-gray-300"></div>
                        
                        {clockingIn && (
                            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10">
                                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
