-- DIRECT FIX: Remove ALL policies conflicting with public INSERT
-- Date: 2025-11-19
-- Problem: "ALL" policies still blocking anonymous INSERT operations
-- Solution: Drop specific conflicting policies and recreate correctly

-- ============================================================================
-- STEP 1: DROP ALL EXISTING POLICIES (explicit names)
-- ============================================================================

-- OWNERS table
DROP POLICY IF EXISTS "owners_org_all" ON owners;
DROP POLICY IF EXISTS "Allow org members to manage their owners" ON owners;
DROP POLICY IF EXISTS "owners_public_insert" ON owners;
DROP POLICY IF EXISTS "owners_org_select" ON owners;
DROP POLICY IF EXISTS "owners_org_update" ON owners;
DROP POLICY IF EXISTS "owners_org_delete" ON owners;

-- DOGS table
DROP POLICY IF EXISTS "dogs_org_all" ON dogs;
DROP POLICY IF EXISTS "Allow org members to manage their dogs" ON dogs;
DROP POLICY IF EXISTS "dogs_public_insert" ON dogs;
DROP POLICY IF EXISTS "dogs_org_select" ON dogs;
DROP POLICY IF EXISTS "dogs_org_update" ON dogs;
DROP POLICY IF EXISTS "dogs_org_delete" ON dogs;

-- BOOKINGS table
DROP POLICY IF EXISTS "bookings_org_all" ON bookings;
DROP POLICY IF EXISTS "Allow org members to manage bookings" ON bookings;
DROP POLICY IF EXISTS "bookings_public_insert" ON bookings;
DROP POLICY IF EXISTS "bookings_org_select" ON bookings;
DROP POLICY IF EXISTS "bookings_org_update" ON bookings;
DROP POLICY IF EXISTS "bookings_org_delete" ON bookings;

-- INTEREST_APPLICATIONS table
DROP POLICY IF EXISTS "interest_org_all" ON interest_applications;
DROP POLICY IF EXISTS "Allow org members to manage interest applications" ON interest_applications;
DROP POLICY IF EXISTS "interest_public_insert" ON interest_applications;
DROP POLICY IF EXISTS "interest_org_select" ON interest_applications;
DROP POLICY IF EXISTS "interest_org_update" ON interest_applications;
DROP POLICY IF EXISTS "interest_org_delete" ON interest_applications;

-- ============================================================================
-- STEP 2: CREATE CLEAN POLICIES (NO "ALL" POLICIES)
-- ============================================================================

-- OWNERS: Public can INSERT, org members can SELECT/UPDATE/DELETE
CREATE POLICY "owners_public_insert" ON owners 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

CREATE POLICY "owners_org_select" ON owners 
  FOR SELECT 
  TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "owners_org_update" ON owners 
  FOR UPDATE 
  TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "owners_org_delete" ON owners 
  FOR DELETE 
  TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- DOGS: Public can INSERT, org members can SELECT/UPDATE/DELETE
CREATE POLICY "dogs_public_insert" ON dogs 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

CREATE POLICY "dogs_org_select" ON dogs 
  FOR SELECT 
  TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "dogs_org_update" ON dogs 
  FOR UPDATE 
  TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "dogs_org_delete" ON dogs 
  FOR DELETE 
  TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- BOOKINGS: Public can INSERT, org members can SELECT/UPDATE/DELETE
CREATE POLICY "bookings_public_insert" ON bookings 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

CREATE POLICY "bookings_org_select" ON bookings 
  FOR SELECT 
  TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "bookings_org_update" ON bookings 
  FOR UPDATE 
  TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "bookings_org_delete" ON bookings 
  FOR DELETE 
  TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- INTEREST_APPLICATIONS: Public can INSERT, org members can SELECT/UPDATE/DELETE
CREATE POLICY "interest_public_insert" ON interest_applications 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

CREATE POLICY "interest_org_select" ON interest_applications 
  FOR SELECT 
  TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "interest_org_update" ON interest_applications 
  FOR UPDATE 
  TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "interest_org_delete" ON interest_applications 
  FOR DELETE 
  TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- ============================================================================
-- STEP 3: VERIFY POLICIES
-- ============================================================================

-- Check owners policies
SELECT 
  'owners' as table_name,
  policyname, 
  cmd,
  roles::text[]
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'owners'
ORDER BY cmd, policyname;

-- Check dogs policies
SELECT 
  'dogs' as table_name,
  policyname, 
  cmd,
  roles::text[]
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'dogs'
ORDER BY cmd, policyname;

-- Check bookings policies
SELECT 
  'bookings' as table_name,
  policyname, 
  cmd,
  roles::text[]
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'bookings'
ORDER BY cmd, policyname;

-- Check interest_applications policies
SELECT 
  'interest_applications' as table_name,
  policyname, 
  cmd,
  roles::text[]
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'interest_applications'
ORDER BY cmd, policyname;

-- ============================================================================
-- VERIFICATION: Test if policies would allow anonymous INSERT
-- ============================================================================

-- This should show that anon role can INSERT into owners
SELECT 
  tablename,
  COUNT(*) FILTER (WHERE cmd = 'INSERT' AND 'anon' = ANY(roles)) as anon_insert_policies,
  COUNT(*) FILTER (WHERE cmd = 'ALL') as all_policies_blocking
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('owners', 'dogs', 'bookings', 'interest_applications')
GROUP BY tablename;

COMMENT ON TABLE owners IS 'RLS fixed 2025-11-19: Removed ALL policies, using separate INSERT/SELECT/UPDATE/DELETE';
COMMENT ON TABLE dogs IS 'RLS fixed 2025-11-19: Removed ALL policies, using separate INSERT/SELECT/UPDATE/DELETE';
COMMENT ON TABLE bookings IS 'RLS fixed 2025-11-19: Removed ALL policies, using separate INSERT/SELECT/UPDATE/DELETE';
COMMENT ON TABLE interest_applications IS 'RLS fixed 2025-11-19: Removed ALL policies, using separate INSERT/SELECT/UPDATE/DELETE';
