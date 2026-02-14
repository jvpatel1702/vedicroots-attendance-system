
-- Enhanced Trigger Function to handle Status -> Date and Date -> Status

CREATE OR REPLACE FUNCTION sync_enrollment_bidirectional() RETURNS TRIGGER AS $$
BEGIN
  -- CASE 1: Date Changed (Start or End)
  -- Logic: If dates place the enrollment in past/future, force INACTIVE.
  --        If dates are current, force ACTIVE.
  IF (TG_OP = 'INSERT' OR OLD.start_date IS DISTINCT FROM NEW.start_date OR OLD.end_date IS DISTINCT FROM NEW.end_date) THEN
      
      IF NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE THEN
          -- Past
           IF NEW.status = 'ACTIVE' THEN
               NEW.status := 'INACTIVE';
           END IF;
      ELSIF NEW.start_date > CURRENT_DATE THEN
          -- Future
          NEW.status := 'INACTIVE'; -- Future enrollments wait in INACTIVE state
      ELSE
          -- Current
           IF NEW.status != 'ACTIVE' AND NEW.status != 'GRADUATED' AND NEW.status != 'WITHDRAWN' THEN
               -- Only auto-activate if it was just generic INACTIVE. 
               -- If it was explicitly WITHDRAWN, changing the date shouldn't necessarily undo that unless the user did it?
               -- Actually, if I extend the date, I probably mean to make it active.
               NEW.status := 'ACTIVE';
           END IF;
      END IF;
  END IF;

  -- CASE 2: Status Changed
  -- Logic: If Status updates to INACTIVE/WITHDRAWN/GRADUATED, ensure End Date is set.
  --        If Status updates to ACTIVE, ensure End Date is cleared (or future).
  IF (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM NEW.status) THEN
      
      IF NEW.status IN ('INACTIVE', 'WITHDRAWN', 'GRADUATED') THEN
          -- If closing the enrollment, set end date to today if it's not already set
          IF NEW.end_date IS NULL THEN
              NEW.end_date := CURRENT_DATE;
          END IF;
      ELSIF NEW.status = 'ACTIVE' THEN
          -- If reactivating, clear the end date if it was in the past
          IF NEW.end_date IS NOT NULL AND NEW.end_date < CURRENT_DATE THEN
              NEW.end_date := NULL;
          END IF;
      END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate Trigger to listen to STATUS as well
DROP TRIGGER IF EXISTS on_enrollment_date_change ON enrollments;
DROP TRIGGER IF EXISTS on_enrollment_sync ON enrollments;

CREATE TRIGGER on_enrollment_sync
BEFORE INSERT OR UPDATE OF start_date, end_date, status ON enrollments
FOR EACH ROW
EXECUTE FUNCTION sync_enrollment_bidirectional();
