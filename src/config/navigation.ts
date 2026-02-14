import {
    LayoutDashboard,
    Users,
    UserCheck,
    Settings,
    Calendar,
    BookOpen,
    CreditCard,
    GraduationCap,
    ClipboardCheck,
    CalendarClock,
    FileText,
    TrendingUp,
    ClipboardList,
    Timer,
    Clock
} from 'lucide-react';
import { LucideIcon } from 'lucide-react';

export interface NavItem {
    title: string;
    href: string;
    icon: LucideIcon;
    roles: string[]; // Role based access: ['ADMIN', 'TEACHER', 'OFFICE']
    organizationTypes?: string[]; // Optional: filter by organization type
}

export const navItems: NavItem[] = [
    {
        title: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
        roles: ['ADMIN', 'TEACHER', 'OFFICE']
    },
    {
        title: 'Students',
        href: '/admin/students',
        icon: Users,
        roles: ['ADMIN', 'TEACHER', 'OFFICE']
    },
    {
        title: 'Staff',
        href: '/admin/staff',
        icon: UserCheck,
        roles: ['ADMIN', 'OFFICE']
    },
    {
        title: 'Timesheet',
        href: '/admin/staff-attendance',
        icon: Clock,
        roles: ['ADMIN', 'OFFICE']
    },
    {
        title: 'Classrooms',
        href: '/admin/classrooms',
        icon: GraduationCap,
        roles: ['ADMIN', 'OFFICE']
    },
    {
        title: 'Electives',
        href: '/admin/electives',
        icon: BookOpen,
        roles: ['ADMIN', 'TEACHER', 'OFFICE'],
        organizationTypes: ['SCHOOL'] // Only show for schools, not daycare
    },
    {
        title: 'Enrollments',
        href: '/admin/enrollments',
        icon: ClipboardList,
        roles: ['ADMIN', 'OFFICE']
    },
    {
        title: 'Extended Care',
        href: '/admin/extended-care',
        icon: Timer,
        roles: ['ADMIN', 'OFFICE']
    },
    {
        title: 'Finance',
        href: '/admin/finance',
        icon: CreditCard,
        roles: ['ADMIN'] // OFFICE does NOT have access to Finance
    },
    {
        title: 'Attendance',
        href: '/admin/attendance',
        icon: ClipboardCheck,
        roles: ['ADMIN', 'TEACHER', 'OFFICE']
    },
    {
        title: 'Timetable',
        href: '/admin/timetable',
        icon: CalendarClock,
        roles: ['ADMIN', 'TEACHER', 'OFFICE']
    },
    {
        title: 'Vacations',
        href: '/admin/vacations',
        icon: Calendar,
        roles: ['ADMIN', 'TEACHER', 'OFFICE']
    },
    {
        title: 'Holidays',
        href: '/admin/holidays',
        icon: Calendar,
        roles: ['ADMIN', 'OFFICE']
    },
    {
        title: 'Reports',
        href: '/admin/reports',
        icon: TrendingUp,
        roles: ['ADMIN', 'OFFICE']
    },
    {
        title: 'Settings',
        href: '/admin/settings',
        icon: Settings,
        roles: ['ADMIN', 'OFFICE']
    }
];
