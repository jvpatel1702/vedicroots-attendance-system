/**
 * queryClient.ts
 * --------------
 * Shared TanStack Query client configuration.
 * - staleTime: 5 minutes — data is fresh for 5 min, no refetch during that window
 * - gcTime: 10 minutes — cached data is removed 10 min after last use
 * - retry: only retry on server errors (status >= 500), not on 4xx client errors
 */
import { QueryClient } from '@tanstack/react-query';

export function makeQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 1000 * 60 * 5,   // 5 minutes
                gcTime: 1000 * 60 * 10,      // 10 minutes
                retry: (failureCount, error: any) => {
                    // Don't retry on 4xx errors (auth, not found, etc.)
                    if (error?.status >= 400 && error?.status < 500) return false;
                    return failureCount < 2;
                },
                refetchOnWindowFocus: false,
            },
        },
    });
}
