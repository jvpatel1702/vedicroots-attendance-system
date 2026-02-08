-- DATA MIGRATION: Backfill Persons from Students
-- Run this in Supabase SQL Editor to fix missing names/photos for existing students.

DO $$
DECLARE
    student_rec RECORD;
    new_person_id UUID;
BEGIN
    -- Loop through all students who don't have a linked person record yet
    FOR student_rec IN SELECT * FROM public.students WHERE person_id IS NULL LOOP
        
        -- 1. Create a new Person record for this student
        INSERT INTO public.persons (first_name, last_name, photo_url)
        VALUES (
            student_rec.first_name, 
            student_rec.last_name, 
            student_rec.profile_picture
        )
        RETURNING id INTO new_person_id;

        -- 2. Link the student to the new person
        UPDATE public.students
        SET person_id = new_person_id
        WHERE id = student_rec.id;
        
        RAISE NOTICE 'Migrated Student: % %', student_rec.first_name, student_rec.last_name;
    END LOOP;
END $$;
