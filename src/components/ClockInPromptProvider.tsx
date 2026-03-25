'use client';

/**
 * ClockInPromptProvider
 * ---------------------
 * Global invisible provider (rendered in root layout) that checks, once per page load,
 * whether the current authenticated user needs to clock in for today.
 *
 * Logic:
 *  1. Only runs on protected paths (/admin, /teacher, /office).
 *  2. Waits for the auth user to be resolved via useUser().
 *  3. Calls getStaffClockInStatus() — if the user has no staff record, does nothing.
 *  4. If the staff member hasn't clocked in today, shows a centered modal.
 *  5. Clicking "Clock In" calls clockIn() and closes the modal.
 *  6. "Remind me later" dismisses the modal for the current browser session.
 *
 * Renders null — no visible UI unless the prompt is needed.
 */

import { useEffect, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { Clock, MapPin, Loader2, CheckCircle, X } from 'lucide-react';
import { useUser } from '@/lib/useUser';
import { getStaffClockInStatus, clockIn } from '@/lib/actions/staff-attendance';
import { toast } from 'sonner';

// ── Constants ────────────────────────────────────────────────────────────────

const PROTECTED_PREFIXES = ['/admin', '/teacher', '/office'] as const;
/** Session-storage key used to suppress the prompt after "Remind me later" */
const DISMISSED_KEY = 'clockin_prompt_dismissed';

function isProtectedPath(pathname: string): boolean {
    return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

// ── Types ────────────────────────────────────────────────────────────────────

type PromptState = 'idle' | 'checking' | 'show' | 'hidden';

// ── Component ────────────────────────────────────────────────────────────────

export default function ClockInPromptProvider() {
    const pathname = usePathname();
    const { user, loading: userLoading } = useUser();

    const [promptState, setPromptState] = useState<PromptState>('idle');
    const [staffId, setStaffId] = useState<string | null>(null);
    const [clockingIn, setClockingIn] = useState(false);
    const [locationError, setLocationError] = useState('');
    const [now, setNow] = useState(new Date());

    /** Live clock — updates every second while the modal is visible */
    useEffect(() => {
        if (promptState !== 'show') return;
        const interval = setInterval(() => setNow(new Date()), 1000);
        return () => clearInterval(interval);
    }, [promptState]);

    /** Main effect: check status once the user is resolved and on a protected route */
    useEffect(() => {
        // Prerequisites: protected path, user loaded, user authenticated
        if (!isProtectedPath(pathname ?? '')) return;
        if (userLoading) return;
        if (!user?.id) return;

        // Already dismissed in this session
        if (sessionStorage.getItem(DISMISSED_KEY) === 'true') return;

        // Avoid duplicate checks
        if (promptState !== 'idle') return;

        setPromptState('checking');

        getStaffClockInStatus(user.id).then((status) => {
            if (!status.hasStaffRecord) {
                // Not a staff member — skip prompt silently
                setPromptState('hidden');
                return;
            }
            if (status.isClockedIn) {
                // Already clocked in (or shift done) — nothing to do
                setPromptState('hidden');
                return;
            }
            // Needs to clock in
            setStaffId(status.staffId);
            setPromptState('show');
        });
    }, [pathname, user, userLoading, promptState]);

    // ── Handlers ──────────────────────────────────────────────────────────────

    const getLocation = (): Promise<{ lat: number; lng: number } | null> =>
        new Promise((resolve) => {
            if (!navigator.geolocation) { resolve(null); return; }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => { setLocationError('Location unavailable — clocking in without it.'); resolve(null); },
                { timeout: 5000 }
            );
        });

    const handleClockIn = useCallback(async () => {
        if (!staffId) return;
        setClockingIn(true);
        setLocationError('');

        const loc = await getLocation();
        const res = await clockIn(staffId, loc ?? undefined);

        if (res.success) {
            setPromptState('hidden');
            toast.success('Clocked in successfully! Have a great day.');
        } else {
            toast.error(res.message ?? 'Failed to clock in.');
        }
        setClockingIn(false);
    }, [staffId]);

    const handleDismiss = useCallback(() => {
        sessionStorage.setItem(DISMISSED_KEY, 'true');
        setPromptState('hidden');
    }, []);

    // ── Render ────────────────────────────────────────────────────────────────

    if (promptState !== 'show') return null;

    const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    const dateString = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });

    return (
        // Backdrop
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            aria-modal="true"
            role="dialog"
            aria-labelledby="clockin-title"
        >
            {/* Modal card */}
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header strip */}
                <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 pt-7 pb-8 text-white text-center">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-white/20 mb-3">
                        <Clock size={32} className="text-white" />
                    </div>
                    <h2 id="clockin-title" className="text-xl font-bold">You haven&apos;t clocked in yet</h2>
                    <p className="text-indigo-200 text-sm mt-1">Clock in to start tracking your shift</p>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Live clock display */}
                    <div className="text-center bg-gray-50 rounded-xl py-4 border border-gray-100">
                        <p className="text-3xl font-mono font-bold text-gray-900 tracking-tight">{timeString}</p>
                        <p className="text-xs text-gray-500 mt-1">{dateString}</p>
                    </div>

                    {/* Location note */}
                    <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
                        <MapPin size={11} />
                        Your location will be captured optionally
                    </p>

                    {locationError && (
                        <p className="text-xs text-amber-600 text-center">{locationError}</p>
                    )}

                    {/* Clock In button */}
                    <button
                        onClick={handleClockIn}
                        disabled={clockingIn}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-indigo-200 disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        {clockingIn
                            ? <><Loader2 size={18} className="animate-spin" /> Clocking in...</>
                            : <><CheckCircle size={18} /> Clock In Now</>
                        }
                    </button>

                    {/* Dismiss link */}
                    <button
                        onClick={handleDismiss}
                        className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-1"
                    >
                        Remind me later
                    </button>
                </div>

                {/* Subtle X close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-3 right-3 text-white/70 hover:text-white transition-colors"
                    aria-label="Dismiss"
                >
                    <X size={18} />
                </button>
            </div>
        </div>
    );
}
