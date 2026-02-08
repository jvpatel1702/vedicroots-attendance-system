'use client';

import { LogOut, Building2, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { OrganizationProvider, useOrganization } from '@/context/OrganizationContext';
import { navItems } from '@/config/navigation';
import Sidebar from '@/components/Sidebar';

function AdminLayoutContent({ children }: { children: React.ReactNode }) {
    const router = useRouter();
    const supabase = createClient();
    const { selectedOrganization, organizations, setSelectedOrganization, isLoading: isOrgLoading } = useOrganization();

    const [userRole, setUserRole] = useState<string | null>(null);
    const [isOrgDropdownOpen, setIsOrgDropdownOpen] = useState(false);

    useEffect(() => {
        async function getUserRole() {
            // 1. Check Dev Cookie first
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
            if (user) {
                // Fetch profile
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    setUserRole(profile.role);
                }
            }
        }
        getUserRole();
    }, [supabase]);

    const filteredNavItems = navItems.filter(item =>
        userRole ? item.roles.includes(userRole) : false
    );

    const handleLogout = async () => {
        document.cookie = "dev_role=; path=/; max-age=0";
        await supabase.auth.signOut();
        router.push('/login');
    };

    const handleOrgChange = (org: typeof selectedOrganization) => {
        if (org) {
            setSelectedOrganization(org);
            setIsOrgDropdownOpen(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar - Fixed */}
            <div className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64">
                <Sidebar
                    items={filteredNavItems}
                    organizationType={selectedOrganization?.type}
                />

                {/* Logout Button */}
                <div className="w-64 bg-white border-r border-gray-200 p-4 border-t">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-red-600 hover:bg-red-50 rounded-md transition-colors text-left group"
                    >
                        <LogOut size={18} className="text-red-500 group-hover:text-red-600" />
                        <span className="text-sm font-medium">Sign Out</span>
                    </button>
                </div>
            </div>

            {/* Main Content - Scrollable */}
            <main className="flex-1 md:ml-64 overflow-y-auto h-screen flex flex-col">
                {/* Sticky Organization Header */}
                <div className="sticky top-0 z-40 bg-white border-b border-gray-200 px-8 py-3 flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-3">
                        <Building2 size={20} className="text-brand-olive" />
                        <span className="text-sm text-gray-500">Organization:</span>

                        {/* Dropdown */}
                        <div className="relative">
                            <button
                                onClick={() => setIsOrgDropdownOpen(!isOrgDropdownOpen)}
                                className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded-lg transition-colors"
                            >
                                <span className="font-semibold text-gray-900">
                                    {isOrgLoading ? 'Loading...' : selectedOrganization?.name || 'Select'}
                                </span>
                                <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOrgDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isOrgDropdownOpen && (
                                <>
                                    {/* Backdrop */}
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsOrgDropdownOpen(false)}
                                    />

                                    {/* Dropdown Menu */}
                                    <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px]">
                                        {organizations.map(org => (
                                            <button
                                                key={org.id}
                                                onClick={() => handleOrgChange(org)}
                                                className={`w-full text-left px-4 py-2.5 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg flex items-center justify-between ${selectedOrganization?.id === org.id ? 'bg-brand-olive/10 text-brand-olive' : ''
                                                    }`}
                                            >
                                                <span className="font-medium">{org.name}</span>
                                                <span className="text-xs text-gray-400 uppercase">{org.type}</span>
                                            </button>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {selectedOrganization && (
                        <span className="text-xs bg-brand-olive/10 text-brand-olive px-2 py-1 rounded uppercase font-semibold">
                            {selectedOrganization.type}
                        </span>
                    )}
                </div>

                {/* Page Content */}
                <div className="flex-1 p-8">
                    {children}
                </div>
            </main>
        </div>
    );
}

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

