'use client';

/**
 * QueryProvider.tsx
 * -----------------
 * Client-side wrapper that provides TanStack Query context to the entire app.
 * Kept as a separate 'use client' component so the root layout can remain a Server Component.
 */
import { useState } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { makeQueryClient } from '@/lib/queryClient';

export default function QueryProvider({ children }: { children: React.ReactNode }) {
    // useState ensures the QueryClient is only created once per component lifecycle,
    // avoiding issues with React Strict Mode double-rendering.
    const [queryClient] = useState(() => makeQueryClient());

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
