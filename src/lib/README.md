# `src/lib` — Library Reference

All shared utilities, data clients, query hooks, and server actions used by the app.

---

## 📁 Folder Structure

```
src/lib/
├── actions/          # Server actions (writes — create/update/delete)
├── queries/          # TanStack Query hooks (reads — all data fetching)
├── supabase/         # Server-side Supabase client (SSR/cookie-aware)
├── supabaseAdmin.ts  # Admin Supabase client (service-role, bypasses RLS)
├── supabaseClient.ts # Browser Supabase client (anon key, respects RLS)
├── queryClient.ts    # TanStack QueryClient factory with global defaults
├── useUser.ts        # Hook: get current auth user + role from user_roles
├── attendanceTime.ts # Utility: attendance cutoff time logic (PRESENT/LATE)
├── classroomUtils.ts # Utility: student vacation & school holiday helpers
├── sessionTimeout.ts # Config: inactivity auto-logout timeout (ms)
└── utils.ts          # Utility: cn() — Tailwind class merging helper
```

---

## 📁 `actions/` — Server Actions (Writes Only)

All files use `'use server'` and run on the server. These are called by UI components for mutations.

| File | Handles |
|---|---|
| `users.ts` | Create / update / delete auth users; assign roles via `user_roles` |
| `people.ts` | Create / update records in the `persons` table |
| `academic-years.ts` | Create, activate, and close academic years |
| `electives.ts` | Create / update elective subjects and class offerings |
| `extendedCare.ts` | Manage extended care subscriptions |
| `finance.ts` | Fee records, invoices, and payments |
| `holidays.ts` | Create / update school holidays |
| `pay-periods.ts` | Manage staff pay periods |
| `staff-attendance.ts` | Staff clock-in / clock-out and attendance records |

---

## 📁 `queries/` — TanStack Query Hooks (Reads Only)

All files are client-side hooks returning `useQuery` results. Import via `@/lib/queries`.

| File | Fetches |
|---|---|
| `useStudentQueries.ts` | Students, guardians (via persons join), vacations, enrollments, electives, extended care |
| `useEnrollmentQueries.ts` | Enrollment list (scoped by year + org), single enrollment detail |
| `useDashboardQueries.ts` | Admin dashboard stats and aggregated counts |
| `useMiscQueries.ts` | Org-scoped holidays, vacations, pay periods, staff attendance, teacher dashboard |
| `useOrganizationQueries.ts` | Academic years, classrooms, grades, locations, program settings |
| `useStaffQueries.ts` | Staff roster with optional org scoping |
| `useElectiveQueries.ts` | Elective subjects and offerings |
| `index.ts` | Re-exports all hooks for clean `@/lib/queries` imports |

---

## 📁 `supabase/` — Server-Side Supabase Client

| File | Purpose |
|---|---|
| `server.ts` | Creates a cookie-aware Supabase client for Server Components and Server Actions (uses `@supabase/ssr`). Required for reading the auth session on the server. |

---

## Standalone Files

### `supabaseAdmin.ts`
Creates a **service-role** Supabase client that **bypasses Row Level Security (RLS)**.
Only used inside `actions/` files for privileged operations (e.g. creating users via the Auth Admin API).
> ⚠️ Never import this in client components — the service role key must stay server-side.

### `supabaseClient.ts`
Creates a **browser-side** Supabase client using the public anon key.
Used by query hooks and client components. Respects all RLS policies.

### `queryClient.ts`
Factory function `makeQueryClient()` that returns a configured `QueryClient` with global defaults:
- `staleTime`: 5 min — data stays fresh before a refetch is triggered
- `gcTime`: 10 min — unused cache is garbage-collected after 10 min
- No retry on 4xx errors (auth/not-found); up to 2 retries on 5xx

### `useUser.ts`
Client hook that returns the current authenticated user plus their roles fetched from the `user_roles` table.
Used by components that need to conditionally render based on the logged-in user's identity or role.

### `attendanceTime.ts`
Pure utility functions for attendance cutoff logic:
- `isPastCutoff(gradeType, settings)` — returns true if it's too late to mark Present
- `getAllowedAttendanceActions(gradeType, settings)` — returns which statuses (Present / Absent / Late) are currently allowed

### `classroomUtils.ts`
Pure utility functions for date-based classroom checks:
- `isStudentOnVacation(studentId, vacations, date)` — checks if a student is on vacation on a given date
- `isDateHoliday(date, holidays)` — checks if a date falls within a school holiday

### `sessionTimeout.ts`
Exports `INACTIVITY_TIMEOUT_MS` — the inactivity auto-logout duration in milliseconds.
Reads from `NEXT_PUBLIC_SESSION_INACTIVITY_TIMEOUT_MINUTES` env var (default: 15 min). Set to `0` to disable.

### `utils.ts`
Exports `cn(...inputs)` — the standard shadcn/ui Tailwind class merging helper.
Combines `clsx` (conditional class logic) with `tailwind-merge` (conflict resolution).
Used everywhere a component conditionally applies Tailwind classes.
