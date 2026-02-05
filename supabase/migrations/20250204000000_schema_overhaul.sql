-- Drop tables if they exist to allow clean reset (Order matters for foreign keys)
-- Using CASCADE to automatically drop dependent foreign keys and constraints
drop table if exists public.invoice_items cascade;
drop table if exists public.invoices cascade;
drop table if exists public.fee_structures cascade;
drop table if exists public.attendance cascade;
drop table if exists public.student_medical cascade;
drop table if exists public.student_vacations cascade; -- Explicitly dropping this remnant
drop table if exists public.student_guardians cascade;
drop table if exists public.guardians cascade;
drop table if exists public.enrollments cascade;
drop table if exists public.teacher_classrooms cascade;
drop table if exists public.classroom_grades cascade;
drop table if exists public.students cascade;
drop table if exists public.classrooms cascade;
drop table if exists public.grades cascade;
drop table if exists public.programs cascade;
drop table if exists public.school_settings cascade;
drop table if exists public.locations cascade;
drop table if exists public.academic_years cascade;
drop table if exists public.organizations cascade;
drop table if exists public.profiles cascade;

-- 1. Profiles (Linked to Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role text check (role in ('ADMIN', 'TEACHER')) not null,
  name text,
  email text
);

-- 2. Organizations (e.g., "Vedic Roots Daycare", "Vedic Roots School")
create table public.organizations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  type text check (type in ('SCHOOL', 'DAYCARE')) not null,
  logo_url text
);

-- 3. Locations (Physical addresses)
create table public.locations (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations on delete cascade not null,
  name text not null, -- e.g., "Main Campus", "North Branch"
  address text,
  capacity integer
);

-- 4. Academic Years (e.g., "2025-2026")
create table public.academic_years (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  start_date date not null,
  end_date date not null,
  is_active boolean default false
);

-- 5. Programs (e.g., "Toddler", "Preschool", "K-7")
create table public.programs (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations on delete cascade not null,
  name text not null,
  age_range_start integer, -- in months
  age_range_end integer -- in months
);

-- 6. Grades (e.g., "JK", "SK", "Grade 1")
create table public.grades (
  id uuid default gen_random_uuid() primary key,
  program_id uuid references public.programs on delete cascade, -- Optional link to program
  name text not null,
  "order" integer not null
);

-- 7. Classrooms (Physical/Logical grouping)
create table public.classrooms (
  id uuid default gen_random_uuid() primary key,
  location_id uuid references public.locations on delete cascade not null,
  name text not null,
  capacity integer
);

-- 8. Classroom Grades Junction
create table public.classroom_grades (
  classroom_id uuid references public.classrooms on delete cascade not null,
  grade_id uuid references public.grades on delete cascade not null,
  primary key (classroom_id, grade_id)
);

-- 9. Guardians (Parents/Emergency Contacts)
create table public.guardians (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  email text,
  phone text,
  address text
);

-- 10. Students (Global Profile)
create table public.students (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  dob date not null,
  gender text check (gender in ('Male', 'Female', 'Other')),
  profile_picture text,
  student_number text unique -- Auto-generated
);

-- 11. Student Guardians Junction
create table public.student_guardians (
  student_id uuid references public.students on delete cascade not null,
  guardian_id uuid references public.guardians on delete cascade not null,
  relationship text not null, -- Mother, Father, etc.
  is_primary boolean default false,
  is_pickup_authorized boolean default true,
  is_emergency_contact boolean default true,
  primary key (student_id, guardian_id)
);

-- 12. Student Medical Info
create table public.student_medical (
  student_id uuid references public.students on delete cascade primary key,
  allergies text,
  medical_conditions text,
  medications text,
  doctor_name text,
  doctor_phone text
);

-- 13. Enrollments (Links Student to Classroom/Grade for a Year)
create table public.enrollments (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students on delete cascade not null,
  classroom_id uuid references public.classrooms on delete cascade not null,
  grade_id uuid references public.grades on delete cascade not null,
  academic_year_id uuid references public.academic_years on delete cascade not null,
  status text check (status in ('ACTIVE', 'INACTIVE', 'GRADUATED')) default 'ACTIVE',
  enrollment_date date default CURRENT_DATE
);

-- 14. Teacher Classrooms Junction
create table public.teacher_classrooms (
  teacher_id uuid references public.profiles on delete cascade not null,
  classroom_id uuid references public.classrooms on delete cascade not null,
  is_primary boolean default true,
  primary key (teacher_id, classroom_id)
);

-- 15. Attendance
create table public.attendance (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students on delete cascade not null,
  date date not null default CURRENT_DATE,
  status text check (status in ('PRESENT', 'ABSENT', 'LATE', 'VACATION', 'UNMARKED')) not null,
  marked_by uuid references public.profiles on delete set null,
  timestamp timestamptz default now(),
  arrival_time time, -- For LATE
  unique(student_id, date)
);

-- 16. School Settings (Per Organization)
create table public.school_settings (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations on delete cascade not null,
  cutoff_time time default '09:30:00',
  late_fee_per_minute decimal default 1.00
);

-- 17. Fee Structures (Schema Only for Phase 1)
create table public.fee_structures (
  id uuid default gen_random_uuid() primary key,
  program_id uuid references public.programs on delete cascade not null,
  academic_year_id uuid references public.academic_years on delete cascade not null,
  amount decimal not null,
  frequency text check (frequency in ('MONTHLY', 'ANNUALLY')) default 'MONTHLY'
);

-- 18. Invoices (Schema Only for Phase 1)
create table public.invoices (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students on delete cascade not null,
  billing_month date not null, -- First of the month
  total_amount decimal not null,
  status text check (status in ('DRAFT', 'SENT', 'PAID', 'OVERDUE')) default 'DRAFT',
  due_date date
);

-- 19. Invoice Items (Schema Only for Phase 1)
create table public.invoice_items (
  id uuid default gen_random_uuid() primary key,
  invoice_id uuid references public.invoices on delete cascade not null,
  description text not null,
  amount decimal not null
);


-- RLS Policies (Simplified for Initial Phase)
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.locations enable row level security;
alter table public.academic_years enable row level security;
alter table public.programs enable row level security;
alter table public.grades enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_grades enable row level security;
alter table public.guardians enable row level security;
alter table public.students enable row level security;
alter table public.student_guardians enable row level security;
alter table public.student_medical enable row level security;
alter table public.enrollments enable row level security;
alter table public.teacher_classrooms enable row level security;
alter table public.attendance enable row level security;
alter table public.school_settings enable row level security;
alter table public.fee_structures enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;

-- Universal Read Policies for Authenticated Users (Refine later)
create policy "Read Access" on public.profiles for select to authenticated using (true);
create policy "Read Access" on public.organizations for select to authenticated using (true);
create policy "Read Access" on public.locations for select to authenticated using (true);
create policy "Read Access" on public.academic_years for select to authenticated using (true);
create policy "Read Access" on public.programs for select to authenticated using (true);
create policy "Read Access" on public.grades for select to authenticated using (true);
create policy "Read Access" on public.classrooms for select to authenticated using (true);
create policy "Read Access" on public.classroom_grades for select to authenticated using (true);
create policy "Read Access" on public.guardians for select to authenticated using (true);
create policy "Read Access" on public.students for select to authenticated using (true);
create policy "Read Access" on public.student_guardians for select to authenticated using (true);
create policy "Read Access" on public.student_medical for select to authenticated using (true);
create policy "Read Access" on public.enrollments for select to authenticated using (true);
create policy "Read Access" on public.teacher_classrooms for select to authenticated using (true);
create policy "Read Access" on public.attendance for select to authenticated using (true);
create policy "Read Access" on public.school_settings for select to authenticated using (true);
create policy "Read Access" on public.fee_structures for select to authenticated using (true);
create policy "Read Access" on public.invoices for select to authenticated using (true);
create policy "Read Access" on public.invoice_items for select to authenticated using (true);

-- Teacher Write Policies
create policy "Teacher Attendance Insert" on public.attendance for insert with check (true); -- Simplify for now, logic in app
create policy "Teacher Attendance Update" on public.attendance for update using (true);

-- Admin Write Policies (Assume Admin role check logic later or via Service Role)
-- Supabase Service Role bypasses RLS, so mostly handled there or via specific Admin Policies
