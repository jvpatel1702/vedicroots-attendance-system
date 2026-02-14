-- Enable RLS on the table (if not already enabled)
ALTER TABLE classroom_grades ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users (teachers/admins) to SELECT
-- (This likely already exists, but good to ensure)
CREATE POLICY "Enable read access for authenticated users" 
ON "public"."classroom_grades"
FOR SELECT 
TO authenticated 
USING (true);

-- Policy to allow authenticated users to INSERT
CREATE POLICY "Enable insert for authenticated users" 
ON "public"."classroom_grades"
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Policy to allow authenticated users to DELETE
CREATE POLICY "Enable delete for authenticated users" 
ON "public"."classroom_grades"
FOR DELETE 
TO authenticated 
USING (true);
