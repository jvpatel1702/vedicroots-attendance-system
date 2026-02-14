
-- Function to automatically update status based on start/end dates
CREATE OR REPLACE FUNCTION sync_enrollment_status() RETURNS TRIGGER AS $$
BEGIN
  -- 1. Check if enrollment is in the past (End Date has passed)
  IF NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE THEN
    -- Only update if not already inactive/graduated/withdrawn to avoid overwriting specific codes if desired
    -- BUT user wants to prevent breakage, so forced sync is safer.
    -- However, distinguishing between GRADUATED and INACTIVE is hard.
    -- We will default to INACTIVE unless the status is already one of the finished states?
    -- Let's straightforwardly set to INACTIVE. The specific reason (Graduated vs Withdrawn) 
    -- usually implies an end date. 
    IF NEW.status = 'ACTIVE' THEN
        NEW.status := 'INACTIVE';
    END IF;
  
  -- 2. Check if enrollment is in the future
  ELSIF NEW.start_date > CURRENT_DATE THEN
    -- Future enrollments should not be ACTIVE
    NEW.status := 'INACTIVE'; 
  
  -- 3. Otherwise, it is currently valid
  ELSE
    -- If it was inactive, make it active? 
    -- This helps if a future enrollment becomes current (via date edit)
    -- or a past one is extended.
    NEW.status := 'ACTIVE';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to run this before insert or update of dates
DROP TRIGGER IF EXISTS on_enrollment_date_change ON enrollments;

CREATE TRIGGER on_enrollment_date_change
BEFORE INSERT OR UPDATE OF start_date, end_date ON enrollments
FOR EACH ROW
EXECUTE FUNCTION sync_enrollment_status();
