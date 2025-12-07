-- ============================================================================
-- VERIFIED WORKING RLS POLICIES - 7 December 2025
-- ============================================================================
-- This file documents the CORRECT and WORKING RLS policies.
-- DO NOT modify these without understanding the full impact!
-- ============================================================================

-- PROFILES: Staff can only see their own profile
-- Policy: profiles_read_own
-- USING: (auth.uid() = id)

-- DOGS: Staff can see dogs in their org OR dogs with bookings in their org
-- Policy: dogs_select_owner_and_org
-- USING: (
--   owner_id = auth.uid()                           -- Dog owner can see own dogs
--   OR org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())  -- Staff sees org dogs
--   OR id IN (SELECT dog_id FROM bookings WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))  -- Staff sees dogs with bookings
--   OR owner_id IN (SELECT id FROM owners WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))  -- Staff sees dogs of org owners
-- )

-- OWNERS: Staff can see owners in their org OR owners with bookings in their org
-- Policy: owners_select_self_and_org
-- USING: (
--   id = auth.uid()                                 -- Owner can see themselves
--   OR org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())  -- Staff sees org owners
--   OR id IN (SELECT owner_id FROM bookings WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))  -- Staff sees owners with bookings
-- )

-- ============================================================================
-- TO RESTORE IF BROKEN, RUN:
-- ============================================================================

/*
-- Step 1: Drop all existing SELECT policies
DROP POLICY IF EXISTS "dogs_select_owner_and_org" ON public.dogs;
DROP POLICY IF EXISTS "dogs_select_by_org_or_owner" ON public.dogs;
DROP POLICY IF EXISTS "owners_select_self_and_org" ON public.owners;
DROP POLICY IF EXISTS "owners_select_just_created" ON public.owners;
DROP POLICY IF EXISTS "profiles_select_self" ON public.profiles;

-- Step 2: Create correct policies
CREATE POLICY "dogs_select_owner_and_org"
  ON public.dogs FOR SELECT TO authenticated, anon
  USING (
    owner_id = auth.uid()
    OR org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    OR id IN (SELECT dog_id FROM bookings WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
    OR owner_id IN (SELECT id FROM owners WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  );

CREATE POLICY "owners_select_self_and_org"
  ON public.owners FOR SELECT TO authenticated, anon
  USING (
    id = auth.uid()
    OR org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    OR id IN (SELECT owner_id FROM bookings WHERE org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid()))
  );
*/

-- ============================================================================
-- VERIFICATION QUERY (run to check current state):
-- ============================================================================
-- SELECT tablename, policyname, cmd FROM pg_policies 
-- WHERE tablename IN ('dogs', 'owners', 'profiles') AND cmd = 'SELECT'
-- ORDER BY tablename;
--
-- Expected result:
-- dogs     | dogs_select_owner_and_org   | SELECT
-- owners   | owners_select_self_and_org  | SELECT
-- profiles | profiles_read_own           | SELECT
-- ============================================================================
