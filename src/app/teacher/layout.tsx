'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, ClipboardCheck, BookOpen, LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import DashboardSwitcher from '@/components/DashboardSwitcher';

export default function TeacherLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createClient();

    const handleLogout = async () => {
        // Clear dev cookie
        document.cookie = "dev_role=; path=/; max-age=0";
        await supabase.auth.signOut();
        router.push('/login');
    };

    const navItems = [
        { href: '/teacher', icon: Home, label: 'Home', exact: true },
        { href: '/teacher/attendance', icon: ClipboardCheck, label: 'Attendance' },
        { href: '/teacher/electives', icon: BookOpen, label: 'Electives' },
    ];

    const isActive = (href: string, exact?: boolean) => {
        if (exact) return pathname === href;
        return pathname.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <header className="bg-white shadow-sm p-4 sticky top-0 z-10 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <h1 className="text-lg font-bold text-gray-800">Teacher Dashboard</h1>
                    <DashboardSwitcher />
                </div>
                <button onClick={handleLogout} className="text-gray-500 hover:text-red-600">
                    <LogOut size={20} />
                </button>
            </header>

            <main className="flex-1 p-4 pb-20">
                {children}
            </main>

            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-6 py-3 flex justify-around items-center z-20">
                {navItems.map(({ href, icon: Icon, label, exact }) => (
                    <Link
                        key={href}
                        href={href}
                        className={`flex flex-col items-center gap-1 transition ${isActive(href, exact)
                                ? 'text-indigo-600'
                                : 'text-gray-500 hover:text-indigo-600'
                            }`}
                    >
                        <Icon size={24} />
                        <span className="text-xs font-medium">{label}</span>
                    </Link>
                ))}
            </nav>
        </div>
    );
}
