-- Migration: Drop enrollment_date column from enrollments
-- enrollment_date has been superseded by start_date (added in 20260214_add_enrollment_dates.sql)

ALTER TABLE public.enrollments DROP COLUMN IF EXISTS enrollment_date;
