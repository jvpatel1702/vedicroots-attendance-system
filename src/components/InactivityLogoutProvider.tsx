'use client';

import { usePathname } from 'next/navigation';
import { useUser } from '@/lib/useUser';
import { useInactivityLogout } from '@/hooks/useInactivityLogout';
import { INACTIVITY_TIMEOUT_MS } from '@/lib/sessionTimeout';

const PROTECTED_PREFIXES = ['/admin', '/teacher', '/office'] as const;

function isProtectedPath(pathname: string): boolean {
    return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Provider that runs only on authenticated, protected routes.
 * When the user is idle for INACTIVITY_TIMEOUT_MS, signs out and redirects to /login.
 * Renders nothing (invisible).
 */
export default function InactivityLogoutProvider() {
    const pathname = usePathname();
    const { user, loading } = useUser();
    const enabled = !loading && !!user && isProtectedPath(pathname ?? '');

    useInactivityLogout(INACTIVITY_TIMEOUT_MS, enabled);

    return null;
}
