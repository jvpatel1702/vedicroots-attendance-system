'use client';

import Link from 'next/link';
import { Home, Users, Settings, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const supabase = createClient();

    const handleLogout = async () => {
        // Clear dev cookie
        document.cookie = "dev_role=; path=/; max-age=0";
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center">
                <h1 className="text-lg font-bold text-gray-800">Teacher Dashboard</h1>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-600">
                    <LogOut size={20} />
                </button>
            </header>

            <main className="flex-1 p-4 pb-20">
                {children}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-between items-center z-20">
                <Link href="/teacher" className="flex flex-col items-center gap-1 text-indigo-600">
                    <Home size={24} />
                    <span className="text-xs font-medium">Home</span>
                </Link>
                <Link href="/teacher/classes" className="flex flex-col items-center gap-1 text-gray-500 hover:text-indigo-600 transition">
                    <Users size={24} />
                    <span className="text-xs font-medium">Classes</span>
                </Link>
                <Link href="/teacher/profile" className="flex flex-col items-center gap-1 text-gray-500 hover:text-indigo-600 transition">
                    <Settings size={24} />
                    <span className="text-xs font-medium">Profile</span>
                </Link>
            </nav>
        </div>
    );
}
