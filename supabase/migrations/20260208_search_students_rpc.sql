-- Function to search students by name or number within an organization
-- Joins with enrollments -> classrooms -> locations to filter by organization_id
CREATE OR REPLACE FUNCTION search_students(
  search_term text,
  org_id uuid
)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  student_number text
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT
    s.id,
    s.first_name,
    s.last_name,
    s.student_number
  FROM students s
  JOIN enrollments e ON s.id = e.student_id
  JOIN classrooms c ON e.classroom_id = c.id
  JOIN locations l ON c.location_id = l.id
  WHERE 
    l.organization_id = org_id
    AND e.status = 'ACTIVE'
    AND (
      s.first_name ILIKE '%' || search_term || '%' 
      OR 
      s.last_name ILIKE '%' || search_term || '%'
      OR
      (s.first_name || ' ' || s.last_name) ILIKE '%' || search_term || '%'
      OR
      s.student_number ILIKE '%' || search_term || '%'
    )
  LIMIT 10;
END;
$$;
