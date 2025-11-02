-- Fix RLS policies for dogs table to properly filter by org_id
-- This migration cleans up the 27 conflicting policies and replaces them with 4 clear ones

-- ========================================
-- STEP 1: Drop ALL existing policies
-- ========================================
DROP POLICY IF EXISTS "Allow select dogs for same org" ON dogs;
DROP POLICY IF EXISTS "Block changes to dogs for locked orgs" ON dogs;
DROP POLICY IF EXISTS "Only admin can modify dogs" ON dogs;
DROP POLICY IF EXISTS "Org members can modify org data" ON dogs;
DROP POLICY IF EXISTS "Org members can modify org dogs" ON dogs;
DROP POLICY IF EXISTS "Org members can read org data" ON dogs;
DROP POLICY IF EXISTS "Org members can read org dogs" ON dogs;
DROP POLICY IF EXISTS "Org members can view their own data" ON dogs;
DROP POLICY IF EXISTS "Users can access dogs in their org" ON dogs;
DROP POLICY IF EXISTS "allow_select_dogs" ON dogs;
DROP POLICY IF EXISTS "delete_dogs_admin_only" ON dogs;
DROP POLICY IF EXISTS "delete_own_org" ON dogs;
DROP POLICY IF EXISTS "dogs insert" ON dogs;
DROP POLICY IF EXISTS "dogs select" ON dogs;
DROP POLICY IF EXISTS "dogs update" ON dogs;
DROP POLICY IF EXISTS "dogs_delete_own_org" ON dogs;
DROP POLICY IF EXISTS "dogs_insert" ON dogs;
DROP POLICY IF EXISTS "dogs_insert_own_org" ON dogs;
DROP POLICY IF EXISTS "dogs_select" ON dogs;
DROP POLICY IF EXISTS "dogs_select_own_org" ON dogs;
DROP POLICY IF EXISTS "dogs_update" ON dogs;
DROP POLICY IF EXISTS "dogs_update_own_org" ON dogs;
DROP POLICY IF EXISTS "insert_dogs" ON dogs;
DROP POLICY IF EXISTS "insert_own_org" ON dogs;
DROP POLICY IF EXISTS "read_dogs_in_org" ON dogs;
DROP POLICY IF EXISTS "select_own_org" ON dogs;
DROP POLICY IF EXISTS "update_dogs" ON dogs;
DROP POLICY IF EXISTS "update_own_org" ON dogs;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON dogs;

-- ========================================
-- STEP 2: Create 4 clean, simple policies
-- ========================================

-- SELECT: Users can only see dogs from their organization
CREATE POLICY "dogs_select_own_org"
  ON dogs
  FOR SELECT
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- INSERT: Users can only create dogs in their organization
CREATE POLICY "dogs_insert_own_org"
  ON dogs
  FOR INSERT
  TO authenticated
  WITH CHECK (
    org_id IN (
      SELECT org_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- UPDATE: Users can only update dogs in their organization
CREATE POLICY "dogs_update_own_org"
  ON dogs
  FOR UPDATE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- DELETE: Users can only delete dogs in their organization
CREATE POLICY "dogs_delete_own_org"
  ON dogs
  FOR DELETE
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id 
      FROM profiles 
      WHERE id = auth.uid()
    )
  );

-- ========================================
-- STEP 3: Verification
-- ========================================
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'dogs'
ORDER BY policyname;
