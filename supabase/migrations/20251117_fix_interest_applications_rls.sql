-- FIX: Allow public daycare applications
-- Problem: interest_applications table has no RLS policies, blocking public inserts
-- Solution: Add RLS policy to allow anonymous users to insert applications

-- Enable RLS on interest_applications
ALTER TABLE interest_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone (including anonymous users) to INSERT applications
CREATE POLICY "Allow public to submit daycare applications"
ON interest_applications
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users from same org to SELECT their applications
CREATE POLICY "Allow org members to view their applications"
ON interest_applications
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- Allow authenticated users from same org to UPDATE their applications
CREATE POLICY "Allow org members to update their applications"
ON interest_applications
FOR UPDATE
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- Allow authenticated users from same org to DELETE their applications
CREATE POLICY "Allow org members to delete their applications"
ON interest_applications
FOR DELETE
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);
