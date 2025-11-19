-- EMERGENCY FIX: Remove ALL existing RLS policies and recreate clean
-- Problem: There are conflicting/old policies blocking public inserts
-- Solution: Drop everything and recreate from scratch

-- ============================================================================
-- STEP 1: DISABLE RLS temporarily to see what policies exist
-- ============================================================================

-- Check what policies currently exist on owners table
SELECT policyname, cmd, roles, qual, with_check 
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'owners';

-- ============================================================================
-- STEP 2: DROP ALL POLICIES ON AFFECTED TABLES
-- ============================================================================

-- OWNERS table - drop ALL policies
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'owners'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON owners', policy_record.policyname);
    END LOOP;
END $$;

-- DOGS table - drop ALL policies
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'dogs'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON dogs', policy_record.policyname);
    END LOOP;
END $$;

-- BOOKINGS table - drop ALL policies
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'bookings'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON bookings', policy_record.policyname);
    END LOOP;
END $$;

-- INTEREST_APPLICATIONS table - drop ALL policies
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'interest_applications'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON interest_applications', policy_record.policyname);
    END LOOP;
END $$;

-- CONSENT_LOGS table - drop ALL policies
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'consent_logs'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON consent_logs', policy_record.policyname);
    END LOOP;
END $$;

-- ORGS table - drop ALL policies
DO $$ 
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'orgs'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON orgs', policy_record.policyname);
    END LOOP;
END $$;

-- ============================================================================
-- STEP 3: RECREATE SIMPLE, PERMISSIVE POLICIES
-- ============================================================================

-- OWNERS - Super permissive for public INSERT
CREATE POLICY "owners_public_insert" ON owners
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "owners_org_select" ON owners
FOR SELECT TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "owners_org_all" ON owners
FOR ALL TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- DOGS - Super permissive for public INSERT
CREATE POLICY "dogs_public_insert" ON dogs
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "dogs_org_select" ON dogs
FOR SELECT TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "dogs_org_all" ON dogs
FOR ALL TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- BOOKINGS - Super permissive for public INSERT
CREATE POLICY "bookings_public_insert" ON bookings
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "bookings_org_select" ON bookings
FOR SELECT TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "bookings_org_all" ON bookings
FOR ALL TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- INTEREST_APPLICATIONS - Super permissive for public INSERT
CREATE POLICY "interest_public_insert" ON interest_applications
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "interest_org_select" ON interest_applications
FOR SELECT TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

CREATE POLICY "interest_org_all" ON interest_applications
FOR ALL TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- CONSENT_LOGS - Super permissive for public INSERT
CREATE POLICY "consent_public_insert" ON consent_logs
FOR INSERT TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "consent_org_select" ON consent_logs
FOR SELECT TO authenticated
USING (org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- ORGS - Public can read all
CREATE POLICY "orgs_public_select" ON orgs
FOR SELECT TO anon, authenticated
USING (true);

CREATE POLICY "orgs_members_all" ON orgs
FOR ALL TO authenticated
USING (id IN (SELECT org_id FROM profiles WHERE id = auth.uid()));

-- ============================================================================
-- STEP 4: VERIFY
-- ============================================================================

-- Show final policy count
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('owners', 'dogs', 'bookings', 'interest_applications', 'consent_logs', 'orgs')
GROUP BY tablename
ORDER BY tablename;

-- Show all policies to verify
SELECT tablename, policyname, cmd, roles
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('owners', 'dogs', 'bookings', 'interest_applications', 'consent_logs', 'orgs')
ORDER BY tablename, policyname;

RAISE NOTICE '====================================';
RAISE NOTICE 'EMERGENCY FIX COMPLETE';
RAISE NOTICE 'All old/conflicting policies removed';
RAISE NOTICE 'New simple policies created';
RAISE NOTICE 'Test the application forms now!';
RAISE NOTICE '====================================';
