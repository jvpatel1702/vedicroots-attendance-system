'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

const ACTIVITY_EVENTS = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const;

/**
 * Sets up an inactivity timer that signs the user out and redirects to login
 * after the given period with no activity. Resets the timer on any of the
 * tracked activity events.
 *
 * @param timeoutMs - Inactivity timeout in milliseconds
 * @param enabled - When false, the timer and listeners are not active
 */
export function useInactivityLogout(timeoutMs: number, enabled: boolean) {
    const router = useRouter();
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const logout = useCallback(async () => {
        document.cookie = 'dev_role=; path=/; max-age=0';
        const supabase = createClient();
        await supabase.auth.signOut();
        router.push('/login');
    }, [router]);

    useEffect(() => {
        if (!enabled || timeoutMs <= 0) return;

        function clearTimer() {
            if (timerRef.current !== null) {
                clearTimeout(timerRef.current);
                timerRef.current = null;
            }
        }

        function scheduleLogout() {
            clearTimer();
            timerRef.current = setTimeout(() => {
                timerRef.current = null;
                void logout();
            }, timeoutMs);
        }

        scheduleLogout();

        function onActivity() {
            scheduleLogout();
        }

        for (const event of ACTIVITY_EVENTS) {
            window.addEventListener(event, onActivity);
        }

        return () => {
            clearTimer();
            for (const event of ACTIVITY_EVENTS) {
                window.removeEventListener(event, onActivity);
            }
        };
    }, [enabled, timeoutMs, logout]);
}
