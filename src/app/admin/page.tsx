'use client';

/**
 * Admin Dashboard Overview Page
 * ───────────────────────────────
 * Sections:
 *  1. Greeting header + today's date
 *  2. Holiday banner (when today is a holiday)
 *  3. Quick Summary stat cards (enrollments, total strength, present today, staff)
 *  4. Main two-column layout:
 *     LEFT  — Location Strength table + Recent Activity feed
 *     RIGHT — Mini month calendar + Upcoming Events/Holidays
 */

import { useState, useMemo } from 'react';
import { useOrganization } from '@/context/OrganizationContext';
import {
    Calendar,
    Users,
    UserCheck,
    ChevronLeft,
    ChevronRight,
    Activity,
    GraduationCap,
    TrendingUp,
    TrendingDown,
    Clock,
    PartyPopper,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useDashboardStats } from '@/lib/queries';

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Full month names */
const MONTHS = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

/** Short day names for calendar header */
const DAYS_SHORT = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

/** Formats a date string (YYYY-MM-DD) as "Feb 23" */
function fmtDate(dateStr: string): string {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/** Returns a greeting based on current hour */
function greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
}

/** Full locale date string for the header */
const todayLabel = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
});

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
    label,
    value,
    icon: Icon,
    color,
    sub,
}: {
    label: string;
    value: number | string;
    icon: React.ElementType;
    color: string; // tailwind bg-* class for icon background
    sub?: string;
}) {
    return (
        <Card className="relative overflow-hidden">
            <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                            {label}
                        </p>
                        <p className="text-3xl font-bold text-gray-900">{value}</p>
                        {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
                    </div>
                    <div className={`p-2.5 rounded-xl ${color}`}>
                        <Icon size={20} />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// ── Mini Calendar ─────────────────────────────────────────────────────────────

function MiniCalendar({ holidayDates }: { holidayDates: Set<string> }) {
    const now = new Date();
    const [viewYear, setViewYear] = useState(now.getFullYear());
    const [viewMonth, setViewMonth] = useState(now.getMonth());

    const todayStr = now.toISOString().split('T')[0];

    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

    const cells: (number | null)[] = [
        ...Array(firstDayOfMonth).fill(null),
        ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];

    const prevMonth = () => {
        if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
        else setViewMonth(m => m - 1);
    };
    const nextMonth = () => {
        if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
        else setViewMonth(m => m + 1);
    };

    return (
        <div className="select-none">
            {/* Month nav */}
            <div className="flex items-center justify-between mb-3">
                <button
                    onClick={prevMonth}
                    className="p-1 rounded-md hover:bg-muted transition-colors"
                    aria-label="Previous month"
                >
                    <ChevronLeft size={16} className="text-muted-foreground" />
                </button>
                <span className="font-semibold text-sm text-gray-800">
                    {MONTHS[viewMonth]} {viewYear}
                </span>
                <button
                    onClick={nextMonth}
                    className="p-1 rounded-md hover:bg-muted transition-colors"
                    aria-label="Next month"
                >
                    <ChevronRight size={16} className="text-muted-foreground" />
                </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 mb-1">
                {DAYS_SHORT.map(d => (
                    <div key={d} className="text-center text-[11px] font-medium text-muted-foreground py-1">
                        {d}
                    </div>
                ))}
            </div>

            {/* Day cells */}
            <div className="grid grid-cols-7 gap-y-0.5">
                {cells.map((day, idx) => {
                    if (day === null) {
                        return <div key={`empty-${idx}`} />;
                    }
                    const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                    const isToday = dateStr === todayStr;
                    const isHoliday = holidayDates.has(dateStr);

                    return (
                        <div
                            key={dateStr}
                            className={`
                                relative flex items-center justify-center text-xs font-medium
                                h-8 w-8 mx-auto rounded-full transition-colors
                                ${isToday ? 'bg-indigo-600 text-white shadow-sm' : ''}
                                ${isHoliday && !isToday ? 'bg-amber-100 text-amber-800' : ''}
                                ${!isToday && !isHoliday ? 'text-gray-700 hover:bg-muted' : ''}
                            `}
                            title={isHoliday ? 'Holiday' : undefined}
                        >
                            {day}
                            {isHoliday && !isToday && (
                                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500" />
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-indigo-600" />
                    <span className="text-[11px] text-muted-foreground">Today</span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="w-3 h-3 rounded-full bg-amber-100 border border-amber-400" />
                    <span className="text-[11px] text-muted-foreground">Holiday</span>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const { selectedOrganization, isLoading: isOrgLoading } = useOrganization();
    const { data, isLoading } = useDashboardStats(selectedOrganization?.id);

    // Build a set of holiday date strings for the calendar to highlight
    const holidayDates = useMemo<Set<string>>(() => {
        const set = new Set<string>();
        (data?.upcomingHolidays ?? []).forEach((h: any) => {
            // Expand multi-day holidays into individual dates
            if (h.start_date && h.end_date) {
                const start = new Date(h.start_date + 'T00:00:00');
                const end = new Date(h.end_date + 'T00:00:00');
                const cur = new Date(start);
                while (cur <= end) {
                    set.add(cur.toISOString().split('T')[0]);
                    cur.setDate(cur.getDate() + 1);
                }
            } else if (h.start_date) {
                set.add(h.start_date);
            }
        });
        // Also mark today's holiday if present
        if (data?.todayHoliday) {
            const th = data.todayHoliday;
            if (th.start_date && th.end_date) {
                const s = new Date(th.start_date + 'T00:00:00');
                const e = new Date(th.end_date + 'T00:00:00');
                const c = new Date(s);
                while (c <= e) {
                    set.add(c.toISOString().split('T')[0]);
                    c.setDate(c.getDate() + 1);
                }
            } else if (th.start_date) {
                set.add(th.start_date);
            }
        }
        return set;
    }, [data]);

    const totalStrength = (data?.totalStudents ?? 0) + (data?.totalStaff ?? 0);
    const presentStaff = (data?.presentEmployees ?? []).length;

    if (isOrgLoading) {
        return <div className="p-8 text-muted-foreground">Loading organization…</div>;
    }

    return (
        <div className="space-y-6 pb-10">

            {/* ── Greeting Header ─────────────────────────────────────────── */}
            <div className="flex items-start justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                        {greeting()}, <span className="text-indigo-600">{selectedOrganization?.name || 'Admin'}</span>
                    </h2>
                    <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-1.5">
                        <Calendar size={13} />
                        {todayLabel}
                    </p>
                </div>
            </div>

            {/* ── Holiday Banner ──────────────────────────────────────────── */}
            {data?.todayHoliday && (
                <div className="flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-xl shadow-sm">
                    <div className="p-2 bg-white rounded-lg shadow-sm shrink-0">
                        <PartyPopper className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-amber-900">
                            Today is a School Holiday — {data.todayHoliday.name}
                        </p>
                        <p className="text-sm text-amber-700 opacity-80">
                            Regular attendance marking is paused for today.
                        </p>
                    </div>
                </div>
            )}

            {/* ── Quick Summary Stat Cards ────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    label="Active Enrollments"
                    value={isLoading ? '…' : (data?.totalStudents ?? 0)}
                    icon={GraduationCap}
                    color="bg-indigo-100 text-indigo-600"
                    sub="currently enrolled students"
                />
                <StatCard
                    label="Total Strength"
                    value={isLoading ? '…' : totalStrength}
                    icon={Users}
                    color="bg-violet-100 text-violet-600"
                    sub={`${data?.totalStudents ?? 0} students + ${data?.totalStaff ?? 0} staff`}
                />
                <StatCard
                    label="Students Present"
                    value={isLoading ? '…' : (data?.presentToday ?? 0)}
                    icon={UserCheck}
                    color="bg-green-100 text-green-600"
                    sub={`${data?.absentToday ?? 0} absent · ${data?.lateToday ?? 0} late`}
                />
                <StatCard
                    label="Staff Present"
                    value={isLoading ? '…' : presentStaff}
                    icon={Clock}
                    color="bg-sky-100 text-sky-600"
                    sub={`of ${data?.totalStaff ?? 0} total staff`}
                />
            </div>

            {/* ── Three-column Body — Calendar · Activity · Events ─────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">

                {/* COL 1 — Mini Calendar */}
                <Card>
                    <CardHeader className="pb-3 flex flex-row items-center gap-2 space-y-0">
                        <Calendar size={16} className="text-indigo-500" />
                        <CardTitle className="text-base font-semibold">Calendar</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                        <MiniCalendar holidayDates={holidayDates} />
                    </CardContent>
                </Card>

                {/* COL 2 — Recent Activity */}
                <Card>
                    <CardHeader className="pb-3 flex flex-row items-center gap-2 space-y-0">
                        <Activity size={16} className="text-green-500" />
                        <CardTitle className="text-base font-semibold">Recent Activity</CardTitle>
                        <span className="ml-auto text-xs text-muted-foreground">Last 7 days</span>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {isLoading ? (
                            <p className="text-sm text-muted-foreground italic">Loading…</p>
                        ) : (data?.recentActivity ?? []).length === 0 ? (
                            <div className="py-6 text-center">
                                <p className="text-sm text-muted-foreground italic">
                                    No enrollment changes in the last 7 days.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {(data?.recentActivity ?? []).slice(0, 12).map((item: any) => (
                                    <div
                                        key={item.id}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/40 transition-colors"
                                    >
                                        <div className={`p-1.5 rounded-full shrink-0 ${item.type === 'JOIN'
                                                ? 'bg-green-100 text-green-600'
                                                : 'bg-rose-100 text-rose-600'
                                            }`}>
                                            {item.type === 'JOIN'
                                                ? <TrendingUp size={13} />
                                                : <TrendingDown size={13} />
                                            }
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-800 truncate">
                                                {item.name}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-xs text-muted-foreground">
                                                {fmtDate(item.date)}
                                            </span>
                                            <Badge
                                                variant="secondary"
                                                className={`text-[11px] px-2 py-0.5 ${item.type === 'JOIN'
                                                        ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                                        : 'bg-rose-100 text-rose-700 hover:bg-rose-100'
                                                    }`}
                                            >
                                                {item.type === 'JOIN' ? 'Joined' : 'Left'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* COL 3 — Upcoming Events / Holidays */}
                <Card>
                    <CardHeader className="pb-3 flex flex-row items-center gap-2 space-y-0">
                        <PartyPopper size={16} className="text-amber-500" />
                        <CardTitle className="text-base font-semibold">Upcoming Events</CardTitle>
                        <span className="ml-auto text-xs text-muted-foreground">Next 30 days</span>
                    </CardHeader>
                    <CardContent className="pt-0">
                        {isLoading ? (
                            <p className="text-sm text-muted-foreground italic">Loading…</p>
                        ) : (data?.upcomingHolidays ?? []).length === 0 ? (
                            <div className="py-4 text-center">
                                <p className="text-sm text-muted-foreground italic">
                                    No upcoming holidays in the next 30 days.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {(data?.upcomingHolidays ?? []).map((h: any) => {
                                    const start = new Date(h.start_date + 'T00:00:00');
                                    const isMultiDay = h.end_date && h.end_date !== h.start_date;
                                    return (
                                        <div key={h.id} className="flex gap-3 items-start">
                                            <div className="shrink-0 flex flex-col items-center bg-amber-50 border border-amber-200 rounded-lg px-2 py-1 min-w-[42px]">
                                                <span className="text-[10px] font-semibold text-amber-600 uppercase leading-none">
                                                    {start.toLocaleString('en-US', { month: 'short' })}
                                                </span>
                                                <span className="text-base font-bold text-amber-800 leading-tight">
                                                    {start.getDate()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0 pt-0.5">
                                                <p className="text-sm font-medium text-gray-800 leading-snug">
                                                    {h.name}
                                                </p>
                                                {isMultiDay && (
                                                    <p className="text-xs text-muted-foreground">
                                                        Until {fmtDate(h.end_date)}
                                                    </p>
                                                )}
                                                {h.description && (
                                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                                                        {h.description}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>{/* END three-column layout */}

        </div>
    );
}
