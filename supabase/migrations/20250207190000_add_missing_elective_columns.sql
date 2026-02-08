-- Ensure columns exist even if table was created before they were added to the create definition
alter table public.elective_offerings add column if not exists schedule_day text;
alter table public.elective_offerings add column if not exists schedule_start_time time;
alter table public.elective_offerings add column if not exists schedule_end_time time;
alter table public.elective_offerings add column if not exists start_date date;
alter table public.elective_offerings add column if not exists end_date date;
alter table public.elective_offerings add column if not exists cost_per_class decimal default 0;
alter table public.elective_offerings add column if not exists max_capacity integer;
