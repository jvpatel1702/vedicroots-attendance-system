'use client';

import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface WidgetCardProps {
    /** Label shown under the value (e.g. "Total Enrollments") */
    title: string;
    /** Main value to display (number or string) */
    value: string | number;
    /** Lucide icon component */
    icon: LucideIcon;
    /** Optional URL to make the card a link */
    href?: string;
    /** Optional className for the icon wrapper (default: indigo) */
    iconClassName?: string;
    /** Optional className for the root card */
    className?: string;
}

/**
 * Reusable widget card for dashboards and list pages.
 * Shows an icon, a value, and a title. Optionally links to a page when href is set.
 */
export default function WidgetCard({
    title,
    value,
    icon: Icon,
    href,
    iconClassName = 'bg-indigo-100 text-indigo-600',
    className,
}: WidgetCardProps) {
    const content = (
        <div className="flex items-center gap-3">
            <div className={cn('p-2.5 rounded-lg', iconClassName)}>
                <Icon size={20} />
            </div>
            <div>
                <p className="text-2xl font-bold text-gray-900">{value}</p>
                <p className="text-xs text-gray-500">{title}</p>
            </div>
        </div>
    );

    const cardClasses = cn(
        'bg-white rounded-xl p-4 border border-gray-200',
        href && 'transition-colors hover:border-gray-300 hover:bg-gray-50/50',
        className
    );

    if (href) {
        return (
            <Link href={href} className={cardClasses}>
                {content}
            </Link>
        );
    }

    return <div className={cardClasses}>{content}</div>;
}

// import WidgetCard from '@/components/WidgetCard';
// import { Users, BookOpen } from 'lucide-react';

// // Simple stat (no link)
// <WidgetCard
//   title="Total Enrollments"
//   value={enrollments.length}
//   icon={Users}
// />

// // With link
// <WidgetCard
//   title="Total Enrollments"
//   value={enrollments.length}
//   icon={Users}
//   href="/admin/enrollments"
// />

// // Custom icon color (e.g. green)
// <WidgetCard
//   title="Active Courses"
//   value={count}
//   icon={BookOpen}
//   iconClassName="bg-emerald-100 text-emerald-600"
// />