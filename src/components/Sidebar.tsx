'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LucideIcon, Leaf } from 'lucide-react';

interface SidebarItem {
    title: string;
    href: string;
    icon: LucideIcon;
    organizationTypes?: string[];
}

interface SidebarProps {
    items: SidebarItem[];
    organizationType?: string;
}

export default function Sidebar({ items, organizationType }: SidebarProps) {
    const pathname = usePathname();

    // Filter items based on organization type
    const filteredItems = items.filter(item => {
        if (!item.organizationTypes) return true;
        if (!organizationType) return true;
        return item.organizationTypes.includes(organizationType);
    });

    return (
        <aside className="w-64 bg-white border-r border-gray-200 flex-1 flex flex-col">
            {/* Logo Header */}
            <div className="px-6 py-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-brand-olive to-brand-gold rounded-lg flex items-center justify-center shadow-sm">
                        <Leaf className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold text-gray-900">Vedic Roots</h1>
                        <p className="text-xs text-gray-500">Admin Portal</p>
                    </div>
                </div>
            </div>

            {/* Menu Header */}
            <div className="px-4 py-3 border-b border-gray-100">
                <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    menu
                </h2>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-3 py-4">
                <ul className="space-y-1">
                    {filteredItems.map((item) => {
                        const isActive = pathname === item.href;
                        const Icon = item.icon;

                        return (
                            <li key={item.href}>
                                <Link
                                    href={item.href}
                                    className={`
                                        flex items-center gap-3 px-3 py-2.5 rounded-md
                                        transition-all duration-200 group
                                        ${isActive
                                            ? 'bg-brand-olive/10 text-brand-olive'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                        }
                                    `}
                                >
                                    <Icon
                                        size={18}
                                        className={isActive ? 'text-brand-olive' : 'text-gray-400 group-hover:text-gray-600'}
                                    />
                                    <span className="text-sm font-medium">
                                        {item.title}
                                    </span>
                                </Link>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </aside>
    );
}
