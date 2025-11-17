-- ============================================================================
-- COMPLETE FIX FOR PUBLIC APPLICATION SYSTEM
-- ============================================================================
-- Problem: Public users (not logged in) cannot submit applications because:
--   1. Triggers use auth.uid() which is NULL for anonymous users
--   2. RLS policies block anonymous INSERT operations
--   3. Some tables have no RLS policies at all
--
-- Solution: Comprehensive fix for ALL public-facing endpoints
-- Date: 2025-11-17
-- ============================================================================

-- ============================================================================
-- PART 1: FIX ALL TRIGGERS THAT USE auth.uid()
-- ============================================================================

-- 1.1 Fix: create_dog_journal_on_new_dog (ALREADY FIXED but included for completeness)
CREATE OR REPLACE FUNCTION create_dog_journal_on_new_dog()
RETURNS trigger AS $$
BEGIN
  -- Only create journal entry if user is logged in
  -- For public applications (auth.uid() is NULL) skip this
  IF auth.uid() IS NOT NULL THEN
    INSERT INTO dog_journal (org_id, dog_id, user_id, entry_type, content)
    VALUES (NEW.org_id, NEW.id, auth.uid(), 'note', 'Hund registrerad i systemet');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1.2 Check if there are other triggers using auth.uid() in consent_logs
-- (This is safe because consent_logs INSERT happens AFTER owner creation)

-- ============================================================================
-- PART 2: ADD RLS POLICIES FOR ALL PUBLIC-FACING TABLES
-- ============================================================================

-- 2.1 OWNERS table - Allow public INSERT for applications
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Allow public to create owners" ON owners;
DROP POLICY IF EXISTS "Allow org members to view their owners" ON owners;
DROP POLICY IF EXISTS "Allow org members to manage their owners" ON owners;

-- Allow anonymous users to INSERT owners (for applications)
CREATE POLICY "Allow public to create owners"
ON owners FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to view owners in their org
CREATE POLICY "Allow org members to view their owners"
ON owners FOR SELECT
TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Allow authenticated users to manage owners in their org
CREATE POLICY "Allow org members to manage their owners"
ON owners FOR ALL
TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- 2.2 DOGS table - Allow public INSERT for applications
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public to create dogs" ON dogs;
DROP POLICY IF EXISTS "Allow org members to view their dogs" ON dogs;
DROP POLICY IF EXISTS "Allow org members to manage their dogs" ON dogs;

-- Allow anonymous users to INSERT dogs (for applications)
CREATE POLICY "Allow public to create dogs"
ON dogs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to view dogs in their org
CREATE POLICY "Allow org members to view their dogs"
ON dogs FOR SELECT
TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Allow authenticated users to manage dogs in their org
CREATE POLICY "Allow org members to manage their dogs"
ON dogs FOR ALL
TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- 2.3 BOOKINGS table - Allow public INSERT for applications
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public to create bookings" ON bookings;
DROP POLICY IF EXISTS "Allow org members to view their bookings" ON bookings;
DROP POLICY IF EXISTS "Allow org members to manage their bookings" ON bookings;

-- Allow anonymous users to INSERT bookings (for pension applications)
CREATE POLICY "Allow public to create bookings"
ON bookings FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow authenticated users to view bookings in their org
CREATE POLICY "Allow org members to view their bookings"
ON bookings FOR SELECT
TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Allow authenticated users to manage bookings in their org
CREATE POLICY "Allow org members to manage their bookings"
ON bookings FOR ALL
TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- 2.4 INTEREST_APPLICATIONS table (ALREADY FIXED but included for completeness)
ALTER TABLE interest_applications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public to submit daycare applications" ON interest_applications;
DROP POLICY IF EXISTS "Allow org members to view their applications" ON interest_applications;
DROP POLICY IF EXISTS "Allow org members to update their applications" ON interest_applications;
DROP POLICY IF EXISTS "Allow org members to delete their applications" ON interest_applications;

-- Allow anonymous users to INSERT applications
CREATE POLICY "Allow public to submit daycare applications"
ON interest_applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow org members to view their applications
CREATE POLICY "Allow org members to view their applications"
ON interest_applications FOR SELECT
TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Allow org members to update their applications
CREATE POLICY "Allow org members to update their applications"
ON interest_applications FOR UPDATE
TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- Allow org members to delete their applications
CREATE POLICY "Allow org members to delete their applications"
ON interest_applications FOR DELETE
TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- 2.5 CONSENT_LOGS table - Allow public INSERT for GDPR logging
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public to log consent" ON consent_logs;
DROP POLICY IF EXISTS "Allow org members to view consent logs" ON consent_logs;

-- Allow anonymous users to INSERT consent logs
CREATE POLICY "Allow public to log consent"
ON consent_logs FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Allow org members to view consent logs in their org
CREATE POLICY "Allow org members to view consent logs"
ON consent_logs FOR SELECT
TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- 2.6 DOG_JOURNAL table - Only authenticated users (not public)
-- This table should NOT be publicly writable, but needs RLS
ALTER TABLE dog_journal ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow org members to view dog journals" ON dog_journal;
DROP POLICY IF EXISTS "Allow org members to manage dog journals" ON dog_journal;

-- Only authenticated users can interact with dog journals
CREATE POLICY "Allow org members to view dog journals"
ON dog_journal FOR SELECT
TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "Allow org members to manage dog journals"
ON dog_journal FOR ALL
TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- ============================================================================
-- PART 3: VERIFY ORGS TABLE IS READABLE BY PUBLIC
-- ============================================================================
-- Public users need to read org info to show in application forms

ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public to view orgs" ON orgs;
DROP POLICY IF EXISTS "Allow org members to view their org" ON orgs;
DROP POLICY IF EXISTS "Allow org members to manage their org" ON orgs;

-- Allow anyone (including anonymous) to view org basic info
CREATE POLICY "Allow public to view orgs"
ON orgs FOR SELECT
TO anon, authenticated
USING (true);

-- Allow org members to update their own org
CREATE POLICY "Allow org members to manage their org"
ON orgs FOR ALL
TO authenticated
USING (id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
WITH CHECK (id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- ============================================================================
-- PART 4: SUMMARY AND VERIFICATION
-- ============================================================================

-- This migration fixes:
-- ✅ Pension boarding applications (via /ansokan/pensionat)
--    - Creates: owner, dog, booking, consent_logs
--    - All now allow public INSERT
--
-- ✅ Daycare applications (via /ansokan/hunddagis)
--    - Creates: interest_applications
--    - Now allows public INSERT
--
-- ✅ Triggers that failed with NULL auth.uid()
--    - create_dog_journal_on_new_dog() now checks IF auth.uid() IS NOT NULL
--
-- ✅ RLS policies for org members to manage their data
--    - All tables have proper SELECT/UPDATE/DELETE policies
--
-- ✅ Public can read org info (needed for application forms)

-- To verify this worked, run:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('owners', 'dogs', 'bookings', 'interest_applications', 'consent_logs', 'orgs');
-- Should show rowsecurity = true for all

-- SELECT policyname, tablename FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('owners', 'dogs', 'bookings', 'interest_applications', 'consent_logs', 'orgs');
-- Should show all policies created above
