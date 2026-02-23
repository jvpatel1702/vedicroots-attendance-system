'use client';

import { LogOut } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { OrganizationProvider, useOrganization } from '@/context/OrganizationContext';
import { navItems } from '@/config/navigation';
import Sidebar from '@/components/Sidebar';

function OfficeLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const supabase = createClient();
    const { selectedOrganization } = useOrganization();

    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        async function getUserRole() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setUserRole(profile.role);

                    // Redirect if not OFFICE role
                    if (profile.role !== 'OFFICE') {
                        if (profile.role === 'ADMIN') {
                            router.push('/admin');
                        } else if (profile.role === 'TEACHER') {
                            router.push('/teacher');
                        }
                    }
                }
            }
        }
        getUserRole();
    }, [supabase, router]);

    const filteredNavItems = navItems.filter(item =>
        userRole ? item.roles.includes(userRole) : false
    );

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push('/login');
    };

    return (
        <div className="min-h-screen bg-gray-50 md:grid md:grid-cols-[16rem_1fr]">
            {/* Sidebar - in flow so main never overlaps; sticky so it stays visible on scroll; 16rem fits "Admin Panel" on one line */}
            <div className="hidden md:flex flex-col sticky top-0 h-screen w-[16rem] flex-shrink-0">
                <Sidebar
                    items={filteredNavItems}
                    organizationType={selectedOrganization?.type}
                />

                {/* Logout Button */}
                <div className="w-full bg-white border-r border-gray-200 p-4 border-t mt-auto">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-md transition-colors text-left group"
                    >
                        <LogOut size={18} className="text-red-500 group-hover:text-red-600" />
                        <span className="text-sm font-medium">Sign Out</span>
                    </button>
                </div>
            </div>

            {/* Main Content - only content on mobile; second column on md+ so never under sidebar */}
            <main className="min-w-0 min-h-screen overflow-y-auto p-4 md:p-8">
                {children}
            </main>
        </div>
    );
}

export default function OfficeLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <OrganizationProvider>
            <OfficeLayoutContent>{children}</OfficeLayoutContent>
        </OrganizationProvider>
    );
}
