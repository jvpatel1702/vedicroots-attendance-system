-- 1. Elective Subjects (Master Data) - Already likely exists but ensuring
create table if not exists public.elective_subjects (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  code text,
  description text,
  created_at timestamptz default now()
);

-- 2. Elective Offerings (Specific Instances)
create table if not exists public.elective_offerings (
  id uuid default gen_random_uuid() primary key,
  subject_id uuid references public.elective_subjects(id) on delete cascade not null,
  academic_year_id uuid references public.academic_years(id) on delete cascade not null,
  teacher_id uuid references public.profiles(id) on delete set null,
  
  -- Schedule Config (for generation)
  schedule_day text, -- 'MONDAY', 'TUESDAY', etc.
  schedule_start_time time,
  schedule_end_time time,
  start_date date, -- When this offering begins in the year
  end_date date,   -- When it ends
  
  -- Financial
  cost_per_class decimal default 0,
  max_capacity integer,
  
  created_at timestamptz default now()
);

-- 3. Elective Classes (Individual Sessions)
-- This is key for handling "pre-poned/post-poned/cancelled" logic
create table if not exists public.elective_classes (
  id uuid default gen_random_uuid() primary key,
  offering_id uuid references public.elective_offerings(id) on delete cascade not null,
  
  date date not null,
  start_time time not null,
  end_time time not null,
  
  status text check (status in ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'RESCHEDULED')) default 'SCHEDULED',
  topic text, -- Optional: what was taught
  room text,  -- Optional: location override
  
  created_at timestamptz default now()
);

-- 4. Elective Enrollments
create table if not exists public.elective_enrollments (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade not null,
  offering_id uuid references public.elective_offerings(id) on delete cascade not null,
  
  status text check (status in ('ACTIVE', 'DROPPED', 'COMPLETED')) default 'ACTIVE',
  enrollment_date date default CURRENT_DATE, -- When they signed up
  start_date date not null, -- First class they are eligible for
  end_date date, -- Last class date (if dropped)
  
  drop_reason text,
  
  created_at timestamptz default now(),
  unique(student_id, offering_id) -- Prevent double enrollment in same offering
);

-- 5. Elective Attendance (Linked to specific CLASS, not just offering+date)
create table if not exists public.elective_attendance (
  id uuid default gen_random_uuid() primary key,
  class_id uuid references public.elective_classes(id) on delete cascade not null,
  student_id uuid references public.students(id) on delete cascade not null,
  
  status text check (status in ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED')) default 'PRESENT',
  remarks text,
  
  created_at timestamptz default now(),
  unique(class_id, student_id)
);

-- RLS Policies
alter table public.elective_subjects enable row level security;
alter table public.elective_offerings enable row level security;
alter table public.elective_classes enable row level security;
alter table public.elective_enrollments enable row level security;
alter table public.elective_attendance enable row level security;

-- Simple Read Policies
create policy "Read Electives" on public.elective_subjects for select to authenticated using (true);
create policy "Read Offerings" on public.elective_offerings for select to authenticated using (true);
create policy "Read Classes" on public.elective_classes for select to authenticated using (true);
create policy "Read Enrollments" on public.elective_enrollments for select to authenticated using (true);
create policy "Read Attendance" on public.elective_attendance for select to authenticated using (true);

-- Simple Write Policies for now (Admin/Teacher)
create policy "Write Electives" on public.elective_subjects for all to authenticated using (true); 
create policy "Write Offerings" on public.elective_offerings for all to authenticated using (true);
create policy "Write Classes" on public.elective_classes for all to authenticated using (true);
create policy "Write Enrollments" on public.elective_enrollments for all to authenticated using (true);
create policy "Write Attendance" on public.elective_attendance for all to authenticated using (true);
