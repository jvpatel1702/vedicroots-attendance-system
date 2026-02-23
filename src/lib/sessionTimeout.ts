/**
 * Session inactivity timeout configuration.
 * Used for auto-logout when the user is inactive for a configured period.
 */

const DEFAULT_TIMEOUT_MINUTES = 15;

/**
 * Inactivity timeout in milliseconds.
 * Reads from NEXT_PUBLIC_SESSION_INACTIVITY_TIMEOUT_MINUTES when set (client-safe).
 * Set to 0 to disable the inactivity timeout; useInactivityLogout treats timeoutMs <= 0 as disabled.
 */
function getInactivityTimeoutMs(): number {
    const raw = process.env.NEXT_PUBLIC_SESSION_INACTIVITY_TIMEOUT_MINUTES;
    if (typeof raw === 'undefined') {
        return DEFAULT_TIMEOUT_MINUTES * 60 * 1000;
    }
    const minutes = Number(raw);
    if (Number.isNaN(minutes) || minutes < 0) {
        return DEFAULT_TIMEOUT_MINUTES * 60 * 1000;
    }
    if (minutes === 0) {
        return 0;
    }
    return minutes * 60 * 1000;
}

export const INACTIVITY_TIMEOUT_MS = getInactivityTimeoutMs();
