'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/lib/useUser';
import { getStaffClockInStatus, clockOut, autoCloseOpenShiftIfOld } from '@/lib/actions/staff-attendance';
import { Loader2, LogOut } from 'lucide-react';
import { toast } from 'sonner';

/**
 * HeaderClockOutButton
 * --------------------
 * A lightweight button component meant to sit in the global header of every
 * authenticated dashboard layout.
 * 
 * 1. Executes "auto-closure" rule (Option B) invisibly on mount.
 * 2. If the user currently has an ONGOING shift today, displays a red 
 *    "Clock Out" button (Option A). Otherwise, renders nothing.
 */
export default function HeaderClockOutButton() {
    const { user, loading: userLoading } = useUser();
    const router = useRouter();

    const [staffId, setStaffId] = useState<string | null>(null);
    const [isWorking, setIsWorking] = useState(false);
    const [clockingOut, setClockingOut] = useState(false);
    
    useEffect(() => {
        if (userLoading || !user?.id) return;

        async function verifyShift() {
            // First, silently enact the auto-clock-out logic (Option B)
            // if there was a forgotten shift from a previous day.
            const closedShiftCount = await autoCloseOpenShiftIfOld(user?.id!);
            if (closedShiftCount && closedShiftCount > 0) {
                toast.error('Your previous shift was left open and was automatically closed.');
            }

            // Next, determine today's status to rendering Option A
            const status = await getStaffClockInStatus(user?.id!);
            
            if (status.hasStaffRecord && status.isClockedIn && !status.isShiftDone) {
                setStaffId(status.staffId);
                setIsWorking(true);
            } else {
                setIsWorking(false);
            }
        }
        
        verifyShift();
    }, [user, userLoading]);

    const handleClockOut = async () => {
        if (!staffId) return;
        setClockingOut(true);

        const res = await clockOut(staffId);
        
        if (res.success) {
            toast.success('Shift completed. Have a good evening!');
            setIsWorking(false);
        } else {
            toast.error(res.message ?? 'Failed to clock out.');
            setClockingOut(false);
        }
    };

    if (!isWorking) return null;

    return (
        <button
            onClick={handleClockOut}
            disabled={clockingOut}
            className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 py-1.5 px-3 rounded-md text-sm font-semibold transition-colors disabled:opacity-60"
        >
            {clockingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
            Clock Out
        </button>
    );
}
