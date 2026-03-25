'use client';

import { LogOut, Building2, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { createClient } from '@/lib/supabaseClient';
import { OrganizationProvider, useOrganization } from '@/context/OrganizationContext';
import { navItems } from '@/config/navigation';
import Sidebar from '@/components/Sidebar';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import HeaderClockOutButton from '@/components/HeaderClockOutButton';

/**
 * Inner layout content for the Admin section.
 *
 * Handles:
 * - User role verification (via Auth or Dev Cookie).
 * - Navigation filtering based on role.
 * - Sidebar rendering.
 * - Organization switcher in the header.
 */
function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const supabase = createClient();
    const { selectedOrganization, organizations, setSelectedOrganization, isLoading: isOrgLoading } = useOrganization();

    const [userRole, setUserRole] = useState<string | null>(null);

    useEffect(() => {
        async function getUserRole() {
            // 1. Check Dev Cookie first (local dev override)
            const devRole = document.cookie
                .split('; ')
                .find(row => row.startsWith('dev_role='))
                ?.split('=')[1];

            if (devRole) {
                setUserRole(devRole);
                return;
            }

            // 2. Check Supabase Auth
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 3. Fetch the user's highest-priority role from user_roles table.
            //    profiles.role does NOT exist — roles are exclusively in user_roles.
            //    Priority: ADMIN > ORG_ADMIN > SUPER_ADMIN > OFFICE > TEACHER > PARENT
            const ROLE_PRIORITY = ['ADMIN', 'SUPER_ADMIN', 'ORG_ADMIN', 'OFFICE', 'TEACHER', 'PARENT'];

            const { data: roleRows } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id);

            if (roleRows && roleRows.length > 0) {
                const userRoles = roleRows.map((r: any) => r.role as string);
                // Pick the highest-priority role for nav filtering
                const bestRole = ROLE_PRIORITY.find(r => userRoles.includes(r));
                setUserRole(bestRole ?? userRoles[0]);
            }
        }
        getUserRole();
    }, [supabase]);

    // When userRole is null (still loading), show all items so sidebar is never blank.
    // Once the role resolves, filter down to the appropriate items.
    const filteredNavItems = userRole
        ? navItems.filter(item => item.roles.includes(userRole))
        : navItems; // show all while loading — Sidebar itself handles org-type filtering

    const handleLogout = async () => {
        document.cookie = "dev_role=; path=/; max-age=0";
        await supabase.auth.signOut();
        router.push('/login');
    };

    const handleOrgChange = (org: typeof selectedOrganization) => {
        if (org) {
            setSelectedOrganization(org);
        }
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
                    <Button
                        variant="destructive"
                        onClick={handleLogout}
                        className="w-full justify-start gap-3"
                    >
                        <LogOut size={18} />
                        <span className="text-sm font-medium">Sign Out</span>
                    </Button>
                </div>
            </div>

            {/* Main Content - only column on mobile; second column on md+ so never under sidebar */}
            <main className="min-w-0 min-h-screen overflow-y-auto flex flex-col">
                {/* Sticky Organization Header - stays within main column */}
                <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-4 sm:px-6 md:px-8 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <Building2 size={20} className="text-brand-olive" />
                        <span className="text-sm text-gray-500">Organization:</span>

                        {/* Dropdown — now using shadcn dropdown-menu */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 border-gray-200"
                                >
                                    <span className="font-semibold text-gray-900">
                                        {isOrgLoading ? 'Loading...' : selectedOrganization?.name || 'Select'}
                                    </span>
                                    <ChevronDown size={16} className="text-gray-500" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="min-w-[220px]">
                                {organizations.map((org) => (
                                    <DropdownMenuItem
                                        key={org.id}
                                        onClick={() => handleOrgChange(org)}
                                        className={
                                            selectedOrganization?.id === org.id
                                                ? 'bg-brand-olive/10 text-brand-olive flex items-center justify-between'
                                                : 'flex items-center justify-between'
                                        }
                                    >
                                        <span className="font-medium">{org.name}</span>
                                        <span className="text-xs text-gray-400 uppercase">{org.type}</span>
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <div className="flex items-center gap-3">
                        <HeaderClockOutButton />
                        {selectedOrganization && (
                            <span className="text-xs bg-brand-olive/10 text-brand-olive px-2 py-1 rounded uppercase font-semibold">
                                {selectedOrganization.type}
                            </span>
                        )}
                    </div>
                </div>

                {/* Page Content */}
                <div className="flex-1 px-4 sm:px-6 md:px-8 py-6 md:py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

/**
 * The main layout for the Admin Dashboard.
 *
 * Wraps the content with the `OrganizationProvider` to ensure organization context
 * is available throughout the admin pages.
 */
export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <OrganizationProvider>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </OrganizationProvider>
    );
}

