import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Clock In - VedicRoots',
    description: 'Clock in for your shift',
};

export default function ClockInLayout({ children }: { children: React.ReactNode }) {
    // Intentionally empty layout to trap the user
    // No navigation bars, no sidebar, nothing but the prompt.
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            {children}
        </div>
    );
}
