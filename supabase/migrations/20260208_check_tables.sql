SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('school_holidays', 'holidays', 'calendar_events', 'student_vacations');
