-- Add separate cutoff time columns for Kindergarten and Elementary
-- Migration: 20260207210000_separate_cutoff_times.sql

-- Add new columns for separate cutoff times
ALTER TABLE school_settings
ADD COLUMN IF NOT EXISTS cutoff_time_kg time DEFAULT '09:15:00',
ADD COLUMN IF NOT EXISTS cutoff_time_elementary time DEFAULT '09:00:00';

-- Migrate existing cutoff_time value to both new columns (if it exists)
UPDATE school_settings
SET cutoff_time_kg = COALESCE(cutoff_time, '09:15:00'),
    cutoff_time_elementary = COALESCE(cutoff_time, '09:00:00')
WHERE cutoff_time IS NOT NULL;

-- Add comments for clarity
COMMENT ON COLUMN school_settings.cutoff_time_kg IS 'Attendance cutoff time for Kindergarten students (JK, SK)';
COMMENT ON COLUMN school_settings.cutoff_time_elementary IS 'Attendance cutoff time for Elementary students (Grade 1+)';
