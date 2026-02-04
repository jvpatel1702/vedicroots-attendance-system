-- Drop tables if they exist to allow clean reset (Order matters for foreign keys)
drop table if exists public.attendance;
drop table if exists public.students;
drop table if exists public.teacher_classrooms;
drop table if exists public.classroom_grades;
drop table if exists public.classrooms;
drop table if exists public.grades;
drop table if exists public.profiles;
drop table if exists public.school_settings;

-- 1. Profiles (Linked to Auth)
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  role text check (role in ('ADMIN', 'TEACHER')) not null,
  name text,
  email text
);

-- 2. Grades (e.g., "KG 1", "Grade 1")
create table public.grades (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  "order" integer not null
);

-- 3. Classrooms (Physical grouping, e.g., "Ashoka House")
create table public.classrooms (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  capacity integer
);

-- 4. Classroom Grades Junction (Which grades are in which classroom)
create table public.classroom_grades (
  classroom_id uuid references public.classrooms on delete cascade not null,
  grade_id uuid references public.grades on delete cascade not null,
  primary key (classroom_id, grade_id)
);

-- 5. Students
create table public.students (
  id uuid default gen_random_uuid() primary key,
  first_name text not null,
  last_name text not null,
  classroom_id uuid references public.classrooms on delete set null,
  grade_id uuid references public.grades on delete set null,
  profile_picture text
);

-- 6. Teacher Classrooms Junction
create table public.teacher_classrooms (
  teacher_id uuid references public.profiles on delete cascade not null,
  classroom_id uuid references public.classrooms on delete cascade not null,
  primary key (teacher_id, classroom_id)
);

-- 7. Attendance
create table public.attendance (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students on delete cascade not null,
  date date not null default CURRENT_DATE,
  status text check (status in ('PRESENT', 'ABSENT', 'LATE', 'UNMARKED')) not null,
  marked_by uuid references public.profiles on delete set null,
  timestamp timestamptz default now(),
  arrival_time time,
  unique(student_id, date)
);

-- 8. School Settings
create table public.school_settings (
  id uuid default gen_random_uuid() primary key,
  cutoff_time time default '09:30:00',
  school_name text default 'VedicRoots'
);


-- RLS Policies
alter table public.profiles enable row level security;
alter table public.grades enable row level security;
alter table public.classrooms enable row level security;
alter table public.classroom_grades enable row level security;
alter table public.students enable row level security;
alter table public.teacher_classrooms enable row level security;
alter table public.attendance enable row level security;
alter table public.school_settings enable row level security;

-- Public/Auth Read Access
create policy "Public profiles are viewable by authenticated users" on public.profiles
  for select to authenticated using (true);

create policy "Grades are viewable by authenticated users" on public.grades
  for select to authenticated using (true);

create policy "Classrooms are viewable by authenticated users" on public.classrooms
  for select to authenticated using (true);

create policy "Classroom Grades are viewable by authenticated users" on public.classroom_grades
  for select to authenticated using (true);

create policy "Students are viewable by authenticated users" on public.students
  for select to authenticated using (true);

create policy "Teacher Classrooms are viewable by authenticated users" on public.teacher_classrooms
  for select to authenticated using (true);

create policy "School Settings are viewable by authenticated users" on public.school_settings
  for select to authenticated using (true);

-- Attendance Policies
create policy "Attendance is viewable by authenticated users" on public.attendance
  for select to authenticated using (true);

create policy "Teachers can insert attendance for their classes" on public.attendance
  for insert with check (
    exists (
      select 1 from public.students s
      join public.teacher_classrooms tc on s.classroom_id = tc.classroom_id
      where s.id = attendance.student_id
      and tc.teacher_id = auth.uid()
    )
  );

create policy "Teachers can update attendance for their classes" on public.attendance
  for update using (
    exists (
      select 1 from public.students s
      join public.teacher_classrooms tc on s.classroom_id = tc.classroom_id
      where s.id = attendance.student_id
      and tc.teacher_id = auth.uid()
    )
  );

-- Admin Full Access (If using Service Role mostly, this is optional, but good for direct admin login)
-- For simplicity, assuming Admins have specific role in profiles
create policy "Admins have full access to everything" on public.attendance
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'ADMIN'
    )
  );
