-- Migration: Create/Fix school_holidays table and RLS
-- 1. Create table if it doesn't exist
create table if not exists public.school_holidays (
  id uuid default gen_random_uuid() primary key,
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  created_at timestamptz default now()
);

-- 2. Ensure organization_id column exists (in case table was created differently before)
do $$ 
begin
  if not exists (select 1 from information_schema.columns where table_schema='public' and table_name='school_holidays' and column_name='organization_id') then
    alter table public.school_holidays add column organization_id uuid references public.organizations(id) on delete cascade;
  end if;
end $$;

-- 3. Enable RLS
alter table public.school_holidays enable row level security;

-- 4. Simplified RLS Policies (Matching existing pattern in 20250204000000_schema_overhaul.sql)
drop policy if exists "School Holidays are viewable by everyone in org" on public.school_holidays;
drop policy if exists "School Holidays are manageable by admins" on public.school_holidays;
drop policy if exists "Read Access" on public.school_holidays;
drop policy if exists "Write Access" on public.school_holidays;

create policy "Read Access" on public.school_holidays for select to authenticated using (true);
create policy "Write Access" on public.school_holidays for all to authenticated using (true);
