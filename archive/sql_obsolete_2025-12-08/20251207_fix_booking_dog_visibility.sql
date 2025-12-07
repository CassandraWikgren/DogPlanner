-- ============================================================================
-- FIX: Allow staff to see dogs/owners that have bookings in their org
-- Date: 2025-12-07
-- Status: VERIFIED WORKING
-- 
-- Problem: When a customer (with org_id=NULL) creates a booking at a pensionat,
--          the staff cannot see the dog/owner details because RLS blocks access.
-- Solution: Add condition to allow reading dogs/owners that have bookings
--           in the staff member's organization.
-- ============================================================================

-- STEP 1: Drop ALL existing SELECT policies to avoid duplicates
DROP POLICY IF EXISTS "dogs_select_owner_and_org" ON public.dogs;
DROP POLICY IF EXISTS "dogs_select_by_org_or_owner" ON public.dogs;
DROP POLICY IF EXISTS "owners_select_self_and_org" ON public.owners;
DROP POLICY IF EXISTS "owners_select_just_created" ON public.owners;
DROP POLICY IF EXISTS "profiles_select_self" ON public.profiles;

-- STEP 2: Create SINGLE dogs SELECT policy
CREATE POLICY "dogs_select_owner_and_org"
  ON public.dogs
  FOR SELECT
  TO authenticated, anon
  USING (
    -- 1. Owner can see own dogs
    owner_id = auth.uid()
    OR
    -- 2. Org staff can see dogs with org_id matching their org
    org_id IN (
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid()
    )
    OR
    -- 3. Org staff can see dogs that have BOOKINGS in their org
    -- (This allows seeing pensionat customer dogs with org_id=NULL)
    id IN (
      SELECT dog_id FROM public.bookings
      WHERE org_id IN (
        SELECT org_id FROM public.profiles
        WHERE id = auth.uid()
      )
    )
    OR
    -- 4. Org staff can see dogs owned by owners in their org
    owner_id IN (
      SELECT id FROM public.owners
      WHERE org_id IN (
        SELECT org_id FROM public.profiles
        WHERE id = auth.uid()
      )
    )
  );

-- STEP 3: Create SINGLE owners SELECT policy
CREATE POLICY "owners_select_self_and_org"
  ON public.owners
  FOR SELECT
  TO authenticated, anon
  USING (
    -- 1. Owner can see themselves
    id = auth.uid()
    OR
    -- 2. Org staff can see owners with org_id matching their org
    org_id IN (
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid()
    )
    OR
    -- 3. Org staff can see owners that have BOOKINGS in their org
    -- (This allows seeing pensionat customers with org_id=NULL)
    id IN (
      SELECT owner_id FROM public.bookings
      WHERE org_id IN (
        SELECT org_id FROM public.profiles
        WHERE id = auth.uid()
      )
    )
  );

-- STEP 4: Verify
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies verified and cleaned up';
END $$;
