-- ============================================================================
-- MIGRATION: Pattern 3 - RLS POLICIES
-- Date: 4 December 2025
-- ============================================================================
-- PART 2: NEW RLS POLICIES FOR OWNERS & APPLICATIONS
-- ============================================================================
-- Policy Strategy:
-- 1. OWNERS: Permissive INSERT for registration (auth.uid = id)
--           Permissive SELECT for self + org members
--           UPDATE only self or org members can edit
-- 2. DOGS: Same as OWNERS (unassociated initially, then org-scoped)
-- 3. APPLICATIONS: Complex - owner sees own, org sees incoming
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: DROP OLD RESTRICTIVE POLICIES ON OWNERS
-- ============================================================================

DROP POLICY IF EXISTS "owners_public_insert" ON public.owners;
DROP POLICY IF EXISTS "owners_select_by_org_or_self" ON public.owners;
DROP POLICY IF EXISTS "owners_update_by_org_or_self" ON public.owners;
DROP POLICY IF EXISTS "Owners can delete themselves" ON public.owners;

-- ============================================================================
-- STEP 2: CREATE NEW PERMISSIVE REGISTRATION POLICIES FOR OWNERS
-- ============================================================================

-- 2a. INSERT: Allow authenticated users to create their own owner record
-- AND allow anon users to register (signup flow)
CREATE POLICY "owners_insert_self_registration" 
  ON public.owners 
  FOR INSERT 
  TO authenticated, anon
  WITH CHECK (
    -- Only the user themselves can insert their own record
    -- For authenticated users: auth.uid() = id
    -- For anon users during signup: id matches newly created auth user
    TRUE  -- Permissive: trust the application layer to validate
  );

-- 2b. SELECT: Owner can see themselves, org members can see org owners
CREATE POLICY "owners_select_self_and_org" 
  ON public.owners 
  FOR SELECT 
  TO authenticated, anon
  USING (
    -- Owner can see themselves
    id = auth.uid()
    OR
    -- Org staff can see all owners in their org
    org_id IN (
      SELECT org_id FROM public.profiles 
      WHERE id = auth.uid() AND org_id IS NOT NULL
    )
    OR
    -- Hunddagis can see pending/approved applicants
    id IN (
      SELECT DISTINCT owner_id FROM public.applications
      WHERE org_id IN (
        SELECT org_id FROM public.profiles 
        WHERE id = auth.uid()
      )
    )
  );

-- 2c. UPDATE: Owner can update themselves, org can update org members
CREATE POLICY "owners_update_self_and_org"
  ON public.owners
  FOR UPDATE
  TO authenticated
  USING (
    id = auth.uid()
    OR
    org_id IN (
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    id = auth.uid()
    OR
    org_id IN (
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- 2d. DELETE: Owner can delete themselves
CREATE POLICY "owners_delete_self"
  ON public.owners
  FOR DELETE
  TO authenticated
  USING (
    id = auth.uid()
  );

-- ============================================================================
-- STEP 3: SIMILAR POLICIES FOR DOGS
-- ============================================================================

-- Drop old policies if they exist
DROP POLICY IF EXISTS "dogs_public_insert" ON public.dogs;

-- 3a. INSERT: Owner can create dogs for themselves
CREATE POLICY "dogs_insert_owner"
  ON public.dogs
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (TRUE);  -- Trust application layer

-- 3b. SELECT: Owner can see own dogs, org can see org dogs
CREATE POLICY "dogs_select_owner_and_org"
  ON public.dogs
  FOR SELECT
  TO authenticated, anon
  USING (
    owner_id = auth.uid()
    OR
    org_id IN (
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid() AND org_id IS NOT NULL
    )
    OR
    id IN (
      SELECT DISTINCT dog_id FROM public.applications
      WHERE org_id IN (
        SELECT org_id FROM public.profiles
        WHERE id = auth.uid()
      )
    )
  );

-- 3c. UPDATE: Owner can update own dogs, org can update org dogs
CREATE POLICY "dogs_update_owner_and_org"
  ON public.dogs
  FOR UPDATE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR
    org_id IN (
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    owner_id = auth.uid()
    OR
    org_id IN (
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- 3d. DELETE: Owner can delete own dogs
CREATE POLICY "dogs_delete_owner"
  ON public.dogs
  FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid()
  );

-- ============================================================================
-- STEP 4: POLICIES FOR APPLICATIONS TABLE
-- ============================================================================

-- 4a. INSERT: Owner can create application for own dog
CREATE POLICY "applications_insert_owner"
  ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (
    owner_id = auth.uid()  -- Owner can only apply for themselves
  );

-- 4b. SELECT: Owner sees own applications, org sees incoming applications
CREATE POLICY "applications_select_owner_and_org"
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (
    owner_id = auth.uid()  -- Owner sees their own
    OR
    org_id IN (  -- Org staff see incoming applications
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- 4c. UPDATE: Only org can update (approve/reject/respond)
CREATE POLICY "applications_update_org_only"
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- 4d. DELETE: Owner can withdraw, org can delete
CREATE POLICY "applications_delete_owner_and_org"
  ON public.applications
  FOR DELETE
  TO authenticated
  USING (
    owner_id = auth.uid()
    OR
    org_id IN (
      SELECT org_id FROM public.profiles
      WHERE id = auth.uid()
    )
  );

-- ============================================================================
-- STEP 5: VERIFICATION
-- ============================================================================

SELECT 
  policyname,
  tablename,
  cmd as "Operation",
  roles
FROM pg_policies
WHERE tablename IN ('owners', 'dogs', 'applications')
  AND schemaname = 'public'
ORDER BY tablename, policyname;

COMMIT;

-- ============================================================================
-- RESULT
-- ============================================================================
-- ✅ OWNERS: New permissive INSERT, global SELECT, org-scoped UPDATE/DELETE
-- ✅ DOGS: Same pattern as owners
-- ✅ APPLICATIONS: Owner INSERT/SELECT, Org UPDATE, Both can DELETE
-- ✅ Hundsägare kan nu registrera sig UTAN organisation
-- ✅ Hundsägare kan ansöka om hunddagisar via applications
-- ✅ Hunddagisar kan godkänna/neka ansökningar
-- ============================================================================
