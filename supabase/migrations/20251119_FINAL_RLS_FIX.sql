-- FINAL FIX: Enable RLS with working policies for public applications
-- Date: 2025-11-19
-- Problem: RLS was disabled for testing, now we enable it with correct policies

-- ============================================================================
-- STEP 1: Enable RLS on all application tables
-- ============================================================================

ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop any existing policies (clean slate)
-- ============================================================================

DROP POLICY IF EXISTS "owners_public_insert" ON owners;
DROP POLICY IF EXISTS "owners_org_select" ON owners;
DROP POLICY IF EXISTS "owners_org_update" ON owners;
DROP POLICY IF EXISTS "owners_org_delete" ON owners;

DROP POLICY IF EXISTS "dogs_public_insert" ON dogs;
DROP POLICY IF EXISTS "dogs_org_select" ON dogs;
DROP POLICY IF EXISTS "dogs_org_update" ON dogs;
DROP POLICY IF EXISTS "dogs_org_delete" ON dogs;

DROP POLICY IF EXISTS "bookings_public_insert" ON bookings;
DROP POLICY IF EXISTS "bookings_org_select" ON bookings;
DROP POLICY IF EXISTS "bookings_org_update" ON bookings;
DROP POLICY IF EXISTS "bookings_org_delete" ON bookings;

DROP POLICY IF EXISTS "consent_public_insert" ON consent_logs;
DROP POLICY IF EXISTS "consent_org_select" ON consent_logs;

-- ============================================================================
-- STEP 3: Create working policies (PUBLIC INSERT + ORG-BASED MANAGEMENT)
-- ============================================================================

-- OWNERS: Anyone can INSERT (applications), members can manage their org's data
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

-- DOGS: Anyone can INSERT (applications), members can manage their org's data
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

-- BOOKINGS: Anyone can INSERT (applications), members can manage their org's data
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

-- CONSENT_LOGS: Anyone can INSERT (GDPR logs), members can read their org's logs
CREATE POLICY "consent_public_insert" ON consent_logs 
  FOR INSERT 
  TO anon, authenticated 
  WITH CHECK (true);

CREATE POLICY "consent_org_select" ON consent_logs 
  FOR SELECT 
  TO authenticated
  USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- ============================================================================
-- STEP 4: Verify policies are correct
-- ============================================================================

SELECT 
  tablename,
  policyname,
  cmd,
  roles::text[],
  permissive
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename IN ('owners', 'dogs', 'bookings', 'consent_logs')
ORDER BY tablename, cmd, policyname;

-- ============================================================================
-- STEP 5: Test anonymous INSERT
-- ============================================================================

-- Simulate anonymous user
SET ROLE anon;

-- Test INSERT into owners (should work!)
INSERT INTO owners (org_id, full_name, email, phone, city, gdpr_consent)
SELECT 
  id,
  'RLS Test User',
  'rls-test@example.com',
  '0700000000',
  'Stockholm',
  true
FROM orgs 
LIMIT 1
RETURNING id, full_name;

-- Reset role
RESET ROLE;

-- Clean up test data
DELETE FROM owners WHERE email = 'rls-test@example.com';

-- Confirmation message
SELECT 'RLS policies successfully configured! Public applications now work.' as status;
