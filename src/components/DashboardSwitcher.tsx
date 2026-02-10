'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { useRouter, usePathname } from 'next/navigation';
import { ChevronDown, Shield, GraduationCap, Building, Users } from 'lucide-react';

interface DashboardOption {
    role: string;
    label: string;
    path: string;
    icon: React.ReactNode;
    color: string;
}

const DASHBOARD_OPTIONS: DashboardOption[] = [
    { role: 'ADMIN', label: 'Admin Panel', path: '/admin', icon: <Shield size={16} />, color: 'text-red-600' },
    { role: 'TEACHER', label: 'Teacher Dashboard', path: '/teacher', icon: <GraduationCap size={16} />, color: 'text-blue-600' },
    { role: 'OFFICE', label: 'Office Dashboard', path: '/office', icon: <Building size={16} />, color: 'text-green-600' },
    { role: 'PARENT', label: 'Parent Portal', path: '/parent', icon: <Users size={16} />, color: 'text-purple-600' },
];

export default function DashboardSwitcher() {
    const supabase = createClient();
    const router = useRouter();
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const [userRoles, setUserRoles] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        async function fetchRoles() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('role, roles')
                    .eq('id', user.id)
                    .single();

                if (profile) {
                    // Use roles array if available, otherwise fall back to single role
                    const roles = profile.roles && profile.roles.length > 0
                        ? profile.roles
                        : [profile.role];
                    setUserRoles(roles);
                }
            }
            setLoading(false);
        }
        fetchRoles();
    }, [supabase]);

    // Close dropdown on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Get available dashboards based on user roles
    const availableDashboards = DASHBOARD_OPTIONS.filter(d => userRoles.includes(d.role));

    // Get current dashboard
    const currentDashboard = DASHBOARD_OPTIONS.find(d => pathname.startsWith(d.path));

    // Don't show if user has only one role or still loading
    if (loading || availableDashboards.length <= 1) {
        return null;
    }

    const handleSwitch = (path: string) => {
        setIsOpen(false);
        router.push(path);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
                {currentDashboard && (
                    <span className={currentDashboard.color}>{currentDashboard.icon}</span>
                )}
                <span>{currentDashboard?.label || 'Switch Dashboard'}</span>
                <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
                    {availableDashboards.map(dashboard => (
                        <button
                            key={dashboard.role}
                            onClick={() => handleSwitch(dashboard.path)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 transition-colors ${pathname.startsWith(dashboard.path) ? 'bg-gray-50 font-medium' : ''
                                }`}
                        >
                            <span className={dashboard.color}>{dashboard.icon}</span>
                            <span>{dashboard.label}</span>
                            {pathname.startsWith(dashboard.path) && (
                                <span className="ml-auto text-xs text-gray-400">Current</span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
