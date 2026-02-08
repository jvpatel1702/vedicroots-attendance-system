-- ============================================
-- SQL Scripts for VedicRoots Attendance System
-- Run these in Supabase SQL Editor
-- ============================================

-- ===========================================
-- STEP 1: Add separate cutoff time columns
-- ===========================================
-- This adds two separate cutoff time columns for Kindergarten and Elementary

ALTER TABLE school_settings
ADD COLUMN IF NOT EXISTS cutoff_time_kg time DEFAULT '09:15:00',
ADD COLUMN IF NOT EXISTS cutoff_time_elementary time DEFAULT '09:00:00';

-- Migrate existing cutoff_time value to both new columns (if it exists)
UPDATE school_settings
SET cutoff_time_kg = COALESCE(cutoff_time, '09:15:00'),
    cutoff_time_elementary = COALESCE(cutoff_time, '09:00:00')
WHERE cutoff_time IS NOT NULL
  AND (cutoff_time_kg IS NULL OR cutoff_time_elementary IS NULL);

-- ===========================================
-- STEP 2: (OPTIONAL) Clear existing data
-- ===========================================
-- CAUTION: Only run this if you want to DELETE all existing students/persons
-- and start fresh with CSV import. This will remove ALL student data!

-- Uncomment the lines below to execute:

-- DELETE FROM attendance;
-- DELETE FROM enrollments;
-- DELETE FROM students;
-- DELETE FROM persons WHERE id IN (
--     SELECT p.id FROM persons p
--     LEFT JOIN staff s ON s.person_id = p.id
--     WHERE s.id IS NULL
-- );

-- ===========================================
-- STEP 3: Verify your data
-- ===========================================
-- Run these queries to check your data:

-- Check organizations:
-- SELECT * FROM organizations;

-- Check grades linked to orgs:
-- SELECT g.id, g.name, p.name as program, o.name as org
-- FROM grades g
-- JOIN programs p ON g.program_id = p.id
-- JOIN organizations o ON p.organization_id = o.id;

-- Check classrooms linked to orgs:
-- SELECT c.id, c.name, l.name as location, o.name as org
-- FROM classrooms c
-- JOIN locations l ON c.location_id = l.id
-- JOIN organizations o ON l.organization_id = o.id;

-- Check students count:
-- SELECT COUNT(*) FROM students;

-- ===========================================
-- NOTES
-- ===========================================
-- After running Step 1, you can use the CSV import feature
-- in Admin > Students > Import CSV button
-- 
-- CSV Format:
-- first_name,last_name,dob,grade,classroom,student_number
-- John,Doe,2019-05-15,JK,KG 1,S1001
-- Jane,Smith,2020-03-20,SK,KG 2,
