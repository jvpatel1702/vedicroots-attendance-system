
-- VedicRoots Connect Extension Schema

-- 1. Configuration Table
CREATE TABLE school_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cutoff_time TIME NOT NULL DEFAULT '09:30:00',
  school_name TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Daily Submissions Tracking
CREATE TABLE classroom_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  classroom_id UUID NOT NULL REFERENCES classrooms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  submitted_by UUID REFERENCES profiles(id),
  UNIQUE (classroom_id, date)
);

-- 3. Audit Log Table
CREATE TABLE attendance_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attendance_id UUID REFERENCES attendance(id) ON DELETE SET NULL,
  student_id UUID NOT NULL,
  changed_by UUID NOT NULL REFERENCES profiles(id),
  old_status attendance_status,
  new_status attendance_status NOT NULL,
  reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Attendance Table Extension (Update)
ALTER TABLE attendance 
ADD COLUMN arrival_time TIME,
ADD COLUMN is_post_cutoff BOOLEAN DEFAULT FALSE,
ADD COLUMN audit_trail JSONB DEFAULT '[]';

-- RLS Update: Teachers can only update attendance if submission for that class/date DOES NOT exist 
-- OR if it's a post-cutoff late arrival allowed by policy.

CREATE POLICY teacher_late_arrival ON attendance FOR UPDATE
USING (
  (SELECT cutoff_time FROM school_settings LIMIT 1) < CURRENT_TIME
  AND (status = 'ABSENT' OR status = 'UNMARKED')
)
WITH CHECK (
  new.status = 'LATE'
);

-- Indexes for monitoring
CREATE INDEX idx_submissions_date ON classroom_submissions(date);
CREATE INDEX idx_audit_timestamp ON attendance_audit_log(timestamp);
