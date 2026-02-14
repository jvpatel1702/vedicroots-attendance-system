
-- Add start_date and end_date columns to enrollments table
-- start_date is DATE and defaults to CURRENT_DATE so existing records are backfilled.
-- end_date is optional (NULL).

ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS start_date DATE DEFAULT CURRENT_DATE NOT NULL;

ALTER TABLE enrollments 
ADD COLUMN IF NOT EXISTS end_date DATE;

-- Update existing records to have enrollment_date as start_date if available, otherwise today
UPDATE enrollments 
SET start_date = enrollment_date 
WHERE enrollment_date IS NOT NULL;

-- Remove the default constraint if desired, but keeping it is useful for simple inserts.
-- ALTER TABLE enrollments ALTER COLUMN start_date DROP DEFAULT;
