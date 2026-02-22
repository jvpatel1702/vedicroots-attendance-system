/**
 * Session inactivity timeout configuration.
 * Used for auto-logout when the user is inactive for a configured period.
 */

const DEFAULT_TIMEOUT_MINUTES = 15;

/**
 * Inactivity timeout in milliseconds.
 * Reads from NEXT_PUBLIC_SESSION_INACTIVITY_TIMEOUT_MINUTES when set (client-safe).
 */
export const INACTIVITY_TIMEOUT_MS =
    typeof process.env.NEXT_PUBLIC_SESSION_INACTIVITY_TIMEOUT_MINUTES !== 'undefined'
        ? Math.max(1, Number(process.env.NEXT_PUBLIC_SESSION_INACTIVITY_TIMEOUT_MINUTES) || DEFAULT_TIMEOUT_MINUTES) *
          60 *
          1000
        : DEFAULT_TIMEOUT_MINUTES * 60 * 1000;
