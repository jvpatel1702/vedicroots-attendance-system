# Database Restructuring — Implementation Plan
**Project:** EduMS Rebuild | **Version:** 1.0 | **Date:** Feb 2026

> **For the development agent:** Read each phase fully before starting it. Every phase has dependencies on the previous one. Do not skip or reorder without flagging it first.

---

## System Context

| Field | Detail |
|---|---|
| Organisations | 2 — Daycare + School (already seeded, do not remove) |
| Auth | Supabase Auth — `profiles` table maps to `auth.users` |
| Database | PostgreSQL via Supabase |
| Current State | Live schema with real data — all migrations must be non-destructive |
| Parent Portal | NOT in scope for Phase 1 — design must not block future addition |
| QuickBooks | One-way CSV export only — no sync-back required |

---

## Migration Sequence at a Glance

| Phase | Title | Key Change | Risk | Order |
|---|---|---|---|---|
| 1 | Persons & Identity Consolidation | Merge duplicate name/contact fields | 🔴 High | First |
| 2 | User Roles Restructure | Replace conflicting role columns | 🔴 High | Second |
| 3 | Unique Constraints | Prevent duplicate records | 🟢 Low | After Phase 1 |
| 4 | Extended Care Linking | Add subscription FK + checkins table | 🟡 Medium | After Phase 1 |
| 5 | Finance Additions | Add scholarships + payments tables | 🟢 Low | After Phase 1 |
| 6 | Table Renames | Align names to documentation | 🟡 Medium | After Phase 3 |
| 7 | Program Settings | Replace hardcoded `school_settings` | 🟢 Low | Last |

---

## Phase 1 — Persons & Identity Consolidation
**Risk:** 🔴 High | **Do First**

### Background
The `persons` table was designed as a single identity source, but `students` and `guardians` still carry their own duplicate name/contact fields. This causes the same person's data to exist in two places, creating sync problems and data drift.

> ⚠️ **Warning:** This phase touches the most foundational tables. Back up all data before running any migration. Test on staging first.

### Problem Statement
- `students` has `first_name`, `last_name`, `dob` alongside `person_id` — duplicated from `persons`
- `guardians` has its own `first_name`, `last_name`, `email`, `phone`, `address` alongside `person_id`
- No enforcement that `students.first_name` matches `persons.first_name` for the same person

### Target State
- `persons` is the single source of truth for all name, DOB, contact, and address fields
- `students` retains only: `person_id`, `student_number`, `profile_picture`, `created_at`, `updated_at`
- `guardians` retains only: `person_id` FK + relationship-level fields

### Tasks

| # | Task | Notes |
|---|---|---|
| 1 | Audit all `students` rows — confirm `person_id` is populated for every record | `SELECT id FROM students WHERE person_id IS NULL` |
| 2 | For any student without a `person_id`, create a `persons` record using the student's own fields | One-time data fix before schema change |
| 3 | Verify `persons` records match `students` fields for all rows | Log any mismatches for manual review |
| 4 | Drop duplicate columns from `students`: `first_name`, `last_name`, `dob`, `gender` | Update all SELECT queries in app first |
| 5 | Repeat audit for `guardians` — confirm `person_id` populated | Same process as tasks 1–2 |
| 6 | Drop duplicate columns from `guardians`: `first_name`, `last_name`, `email`, `phone`, `address` | Update app queries before dropping |
| 7 | Add missing fields to `student_guardians`: `has_billing_responsibility` (bool), `emergency_contact_priority` (int), `custody_notes` (text) | New columns — safe to add without immediate app changes |
| 8 | Update all app queries that reference `students.first_name` to use `persons.first_name` via JOIN | Search codebase for direct column references |

### SQL

```sql
-- Step 1: Verify no orphan students
SELECT id, first_name FROM students WHERE person_id IS NULL;

-- Step 2: Drop duplicate columns (run AFTER app queries are updated)
ALTER TABLE students
  DROP COLUMN first_name,
  DROP COLUMN last_name,
  DROP COLUMN dob,
  DROP COLUMN gender;

-- Step 3: Add missing student_guardians fields
ALTER TABLE student_guardians
  ADD COLUMN has_billing_responsibility boolean DEFAULT false,
  ADD COLUMN emergency_contact_priority integer DEFAULT 1,
  ADD COLUMN custody_notes text;

-- Step 4: Verify no orphan guardians
SELECT id FROM guardians WHERE person_id IS NULL;

-- Step 5: Drop duplicate columns from guardians
ALTER TABLE guardians
  DROP COLUMN first_name,
  DROP COLUMN last_name,
  DROP COLUMN email,
  DROP COLUMN phone,
  DROP COLUMN address;
```

---

## Phase 2 — User Roles Restructure
**Risk:** 🔴 High | **Do Second**

### Background
The `profiles` table currently has two conflicting role columns: `role` (single text) and `roles` (array). Additionally, there is no way to scope a user's role to a specific organisation or location, which is required for the multi-org setup.

> ⚠️ **Warning:** This change directly affects authentication and RLS policies. Coordinate with Supabase RLS rules. Do not drop old columns until all auth middleware has been updated.

### Role Hierarchy

| Role | Access |
|---|---|
| `SUPER_ADMIN` | Full access to all organisations and locations |
| `ORG_ADMIN` | Access to all locations within their assigned organisation |
| `OFFICE` | Limited admin — manage extended care, electives, attendance. Cannot edit students or staff. |
| `TEACHER` | Mobile app — mark attendance, view classroom roster and student info |
| `ELECTIVE_TEACHER` | Can only mark attendance for their assigned elective offering(s) |
| `PARENT` | Future phase — read-only access to their own children only |

### Target State
- Drop `role` and `roles` columns from `profiles`
- Create `user_roles` junction table with: `user_id`, `role`, `organization_id` (nullable), `location_id` (nullable)
- A user can have multiple roles across different orgs/locations

### Tasks

| # | Task | Notes |
|---|---|---|
| 1 | Create `user_roles` table | See SQL below |
| 2 | Migrate existing role data from `profiles` into `user_roles` | Map each `profiles.role` value to a `user_roles` row with correct `org_id` |
| 3 | Update all RLS policies to read from `user_roles` instead of `profiles.role` | Critical — do not skip |
| 4 | Update all app-level auth middleware to query `user_roles` | Search codebase for `profiles.role` references |
| 5 | Drop `role` and `roles` columns from `profiles` once all code is updated | Verify zero code references before dropping |
| 6 | Add indexes on `user_roles(user_id)` and `user_roles(organization_id, role)` | Do after table is populated |

### SQL

```sql
CREATE TABLE public.user_roles (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN (
    'SUPER_ADMIN','ORG_ADMIN','OFFICE','TEACHER','ELECTIVE_TEACHER','PARENT'
  )),
  organization_id uuid,
  location_id uuid,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT user_roles_pkey PRIMARY KEY (id),
  CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id),
  CONSTRAINT user_roles_org_fkey FOREIGN KEY (organization_id) REFERENCES public.organizations(id),
  CONSTRAINT user_roles_loc_fkey FOREIGN KEY (location_id) REFERENCES public.locations(id)
);

CREATE INDEX idx_user_roles_user ON public.user_roles(user_id);
CREATE INDEX idx_user_roles_org_role ON public.user_roles(organization_id, role);

-- Migrate existing roles
INSERT INTO user_roles (user_id, role, organization_id)
SELECT id, role, NULL FROM profiles WHERE role IS NOT NULL;
```

---

## Phase 3 — Unique Constraints
**Risk:** 🟢 Low | **After Phase 1**

### Background
Several tables allow duplicate records that should be impossible by business logic. These constraints enforce data integrity at the database level.

> ℹ️ Before adding constraints, run a de-duplication check on each table. Adding a UNIQUE constraint to a table with existing duplicates will fail.

### Tasks

| # | Task | Notes |
|---|---|---|
| 1 | `enrollments`: `UNIQUE(student_id, classroom_id, academic_year_id)` | Prevents enrolling twice in same class/year |
| 2 | `attendance`: `UNIQUE(student_id, date)` | Prevents duplicate records per student per day |
| 3 | `elective_enrollments`: partial unique on `(student_id, offering_id)` WHERE `status = 'ACTIVE'` | Allows re-enroll after drop, blocks double-active |
| 4 | `user_roles`: `UNIQUE(user_id, role, organization_id, location_id)` | Prevents duplicate role assignments |

### SQL

```sql
-- Enrollments
ALTER TABLE enrollments
  ADD CONSTRAINT unique_enrollment
  UNIQUE (student_id, classroom_id, academic_year_id);

-- Attendance
ALTER TABLE attendance
  ADD CONSTRAINT unique_attendance_per_day
  UNIQUE (student_id, date);

-- Elective enrollments (partial — active only)
CREATE UNIQUE INDEX unique_active_elective_enrollment
  ON elective_enrollments (student_id, offering_id)
  WHERE status = 'ACTIVE';
```

---

## Phase 4 — Extended Care Linking
**Risk:** 🟡 Medium | **After Phase 1**

### Background
`extended_care_subscriptions` and `extended_care_enrollments` have no FK linking them. Billing is time-based (actual drop-off/pickup timestamps), so a checkins table is needed to calculate overages. Elective deductions from extended care charges also need tracking.

### Three Tables to Address

| Table | Purpose |
|---|---|
| `extended_care_subscriptions` | Defines the plan — days, scheduled times, monthly rate. Already exists. |
| `extended_care_enrollments` | Links student to a subscription month. Needs `subscription_id` FK added. |
| `extended_care_checkins` | **NEW** — records actual daily drop-off/pickup times, calculates late fees and overages. |
| `extended_care_adjustments` | **NEW** — records deductions for elective participation (e.g. chess club reduces care time). |

### Tasks

| # | Task | Notes |
|---|---|---|
| 1 | Add `subscription_id` FK to `extended_care_enrollments` | Links enrollment month to the subscription plan |
| 2 | Create `extended_care_checkins` table | See SQL below |
| 3 | Create `extended_care_adjustments` table | See SQL below |
| 4 | Update extended care billing logic to use actual checkin times vs subscription plan times | Flag any hardcoded rate assumptions in app |
| 5 | Ensure elective attendance records trigger `extended_care_adjustments` entries for enrolled students | Coordination between elective and extended care modules |

### SQL

```sql
-- Link enrollments to subscriptions
ALTER TABLE extended_care_enrollments
  ADD COLUMN subscription_id uuid
  REFERENCES public.extended_care_subscriptions(id);

-- Checkins table (actual times for billing)
CREATE TABLE public.extended_care_checkins (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id),
  date date NOT NULL DEFAULT CURRENT_DATE,
  actual_dropoff_time time,
  actual_pickup_time time,
  late_pickup_fee numeric DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT extended_care_checkins_pkey PRIMARY KEY (id),
  CONSTRAINT unique_checkin_per_day UNIQUE (student_id, date)
);

-- Adjustments table (elective deductions)
CREATE TABLE public.extended_care_adjustments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id),
  enrollment_id uuid REFERENCES public.extended_care_enrollments(id),
  adjustment_date date NOT NULL,
  adjustment_type text CHECK (adjustment_type IN ('ELECTIVE','MANUAL')),
  deduction_minutes integer NOT NULL,
  deduction_amount numeric NOT NULL,
  note text,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT extended_care_adjustments_pkey PRIMARY KEY (id)
);
```

---

## Phase 5 — Finance Additions
**Risk:** 🟢 Low | **After Phase 1**

### Background
Invoicing exists but is missing scholarships/discounts (applied as negative line items) and a payments table (to mark invoices as paid). QuickBooks handles downstream payment processing, but the app needs to know an invoice has been paid.

### Tasks

| # | Task | Notes |
|---|---|---|
| 1 | Create `scholarships` table | Applied as negative line items on invoices |
| 2 | Create `payments` table | Records that payment was received |
| 3 | Add `organization_id` to `invoices` | Required for multi-org reporting and RLS |
| 4 | Add `enrollment_id` FK to `invoices` | Links invoice to specific enrollment |
| 5 | QuickBooks CSV export — build as app-level query, no schema change needed | SELECT across `invoices` + `invoice_items` formatted per QB import spec |

### SQL

```sql
CREATE TABLE public.scholarships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id),
  academic_year_id uuid NOT NULL REFERENCES public.academic_years(id),
  discount_type text CHECK (discount_type IN ('PERCENT','FIXED')),
  amount numeric NOT NULL,
  reason text,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT scholarships_pkey PRIMARY KEY (id)
);

CREATE TABLE public.payments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id),
  amount_paid numeric NOT NULL,
  payment_date date NOT NULL DEFAULT CURRENT_DATE,
  method text CHECK (method IN ('CASH','CHEQUE','E_TRANSFER','CREDIT','OTHER')),
  reference_number text,
  recorded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT payments_pkey PRIMARY KEY (id)
);

-- Add org context to invoices
ALTER TABLE invoices
  ADD COLUMN organization_id uuid REFERENCES public.organizations(id),
  ADD COLUMN enrollment_id uuid REFERENCES public.enrollments(id);
```

---

## Phase 6 — Table Renames
**Risk:** 🟡 Medium | **After Phase 3**

### Background
Current table names diverge from the design documentation. Renaming after constraints are in place ensures clean tables before the rest of the codebase is updated.

> ℹ️ In PostgreSQL, renaming a table does not automatically update foreign key or constraint names. Run a global search across all app code for old table names before and after renaming.

### Rename Map

| Current Name | New Name | Impact |
|---|---|---|
| `academic_years` | `school_years` | 🔴 High — many FKs |
| `enrollments` | `student_enrollments` | 🔴 High — core table |
| `attendance` | `attendance_records` | 🔴 High — used everywhere |
| `elective_subjects` | `activity_subjects` | 🟢 Low |
| `elective_offerings` | `activity_offerings` | 🟡 Medium |
| `elective_enrollments` | `student_activity_enrollments` | 🟡 Medium |
| `elective_attendance` | `activity_attendance` | 🟡 Medium |
| `teacher_classrooms` | `staff_classroom_assignments` | 🟡 Medium |

### SQL

```sql
ALTER TABLE academic_years RENAME TO school_years;
ALTER TABLE enrollments RENAME TO student_enrollments;
ALTER TABLE attendance RENAME TO attendance_records;
ALTER TABLE elective_subjects RENAME TO activity_subjects;
ALTER TABLE elective_offerings RENAME TO activity_offerings;
ALTER TABLE elective_enrollments RENAME TO student_activity_enrollments;
ALTER TABLE elective_attendance RENAME TO activity_attendance;
ALTER TABLE teacher_classrooms RENAME TO staff_classroom_assignments;
```

---

## Phase 7 — Program Settings
**Risk:** 🟢 Low | **Last**

### Background
`school_settings` has hardcoded columns for KG and Elementary tiers (`cutoff_time_kg`, `pickup_time_elementary`, etc.). This breaks the moment a third program tier is added. Fix is a `program_settings` table keyed by `program_id`.

### Tasks

| # | Task | Notes |
|---|---|---|
| 1 | Create `program_settings` table | See SQL below |
| 2 | Migrate existing `school_settings` data into `program_settings` rows | Map `_kg` columns → Kindergarten program, `_elementary` → Elementary program |
| 3 | Update app settings UI to manage per-program settings | UI change |
| 4 | Deprecate `school_settings` — keep temporarily, then drop after app is updated | Do not drop immediately |

### SQL

```sql
CREATE TABLE public.program_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  program_id uuid NOT NULL REFERENCES public.programs(id),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  cutoff_time time DEFAULT '09:15:00',
  dropoff_time time DEFAULT '08:30:00',
  pickup_time time DEFAULT '15:30:00',
  late_fee_per_minute numeric DEFAULT 1.00,
  extended_care_rate_monthly numeric DEFAULT 80.00,
  open_time time DEFAULT '07:30:00',
  close_time time DEFAULT '18:00:00',
  late_pickup_fee numeric DEFAULT 5.00,
  CONSTRAINT program_settings_pkey PRIMARY KEY (id),
  CONSTRAINT unique_program_settings UNIQUE (program_id, organization_id)
);
```

---

## Deferred — Phase 2+ Scope

> → The following are intentionally out of scope. The schema above must not block their future addition.

| Item | Notes |
|---|---|
| Parent Portal | `user_roles` already includes `PARENT` role. No schema blockers. |
| Report Cards | `report_card_templates`, `assessment_areas`, `assessment_scores` tables |
| Ratio Compliance | `ratio_requirements`, `daily_ratio_logs` for staff-to-child tracking |
| Staff Work Logs | `staff_work_logs` for clock-in/out across locations (payroll) |
| Payroll Periods | Downstream of `staff_work_logs` |
| Calendar Events | General `calendar_events` table beyond `school_holidays` |
| Communications | `announcements`, `announcement_recipients` |

---

## Testing Checklist (Per Phase)

| Phase | Test | How |
|---|---|---|
| P1 | All students have a matching `persons` record | `SELECT COUNT(*) FROM students WHERE person_id IS NULL` — expect 0 |
| P1 | No guardian has its own name/email fields post-migration | Verify columns are dropped |
| P2 | Every active user has at least one `user_roles` row | Count check |
| P2 | `OFFICE` role cannot edit students | Manual test with OFFICE user session |
| P2 | `ELECTIVE_TEACHER` can only see their assigned offering(s) | Manual test |
| P3 | Duplicate attendance insert fails | Test constraint enforcement |
| P3 | Double-enrolling student in same class/year fails | Test constraint enforcement |
| P4 | Extended care checkin records link correctly to subscriptions | Trace `student_id` across all 3 tables |
| P4 | Elective attendance deducts correctly from extended care charge | Test adjustment calculation |
| P5 | Invoice with scholarship shows correct negative line item | Manual invoice generation test |
| P5 | Payment recorded updates invoice status to `PAID` | Verify invoice status flow |
| P6 | All app queries return correct results after renames | Regression test all major pages |
| P7 | Program settings load correctly per program tier | Confirm KG vs Elementary settings differ |

---

## Notes for the Development Agent

> ⚠️ **Never run a migration directly on production** without testing on a Supabase branch or staging database first.

> ⚠️ **Supabase RLS:** When altering tables that have RLS policies, dropping a column may silently break policies that reference it. Audit RLS policies before any `DROP COLUMN`.

> ℹ️ **App Code:** Before dropping any column, use global search in the codebase for the column name. Update all references first, then drop.

> ℹ️ **Naming:** All new tables follow `snake_case`. All status fields use `UPPER_CASE` text with `CHECK` constraints. No separate lookup tables for enums.

> ℹ️ **Soft Deletes:** All major tables should have `is_active boolean DEFAULT true`. Deleted records are never physically removed — set `is_active = false` instead.

> ℹ️ **Timestamps:** Every new table must have `created_at timestamptz DEFAULT now()` and `updated_at`. Wire `updated_at` to a trigger or handle in the app layer.
