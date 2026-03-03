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
            if (!user) return;

            // profiles.role does NOT exist — roles live in user_roles table.
            const ROLE_PRIORITY = ['ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN', 'OFFICE', 'TEACHER', 'PARENT'];

            const { data: roleRows } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id);

            if (roleRows && roleRows.length > 0) {
                const userRoles = roleRows.map((r: any) => r.role as string);
                const bestRole = ROLE_PRIORITY.find(r => userRoles.includes(r));
                const resolvedRole = bestRole ?? userRoles[0];
                setUserRole(resolvedRole);

                // Redirect if the best role is not OFFICE
                if (resolvedRole !== 'OFFICE') {
                    if (userRoles.includes('ADMIN')) {
                        router.push('/admin');
                    } else if (userRoles.includes('TEACHER')) {
                        router.push('/teacher');
                    }
                }
            }
        }
        getUserRole();
    }, [supabase, router]);

    // Show all nav items while role is loading to prevent blank sidebar
    const filteredNavItems = userRole
        ? navItems.filter(item => item.roles.includes(userRole))
        : navItems;

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
