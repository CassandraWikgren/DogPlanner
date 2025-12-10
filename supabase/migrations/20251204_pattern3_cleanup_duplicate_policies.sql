-- ============================================================================
-- MIGRATION: Pattern 3 - CLEANUP DUPLICATE POLICIES
-- Date: 5 December 2025
-- ============================================================================
-- Remove old policies that were not dropped in previous migration
-- Keep only the new Pattern 3 policies
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: DROP OLD DUPLICATE POLICIES ON DOGS
-- ============================================================================

DROP POLICY IF EXISTS "Owners can delete their own dogs" ON public.dogs;
DROP POLICY IF EXISTS "dogs_select_by_org_or_owner" ON public.dogs;
DROP POLICY IF EXISTS "dogs_update_by_org_or_owner" ON public.dogs;

-- ============================================================================
-- STEP 2: VERIFY REMAINING POLICIES
-- ============================================================================

SELECT 
  tablename,
  policyname,
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
-- ✅ Removed duplicate dog policies
-- ✅ Only Pattern 3 policies remain:
--    - owners: _insert_self_registration, _select_self_and_org, _update_self_and_org, _delete_self
--    - dogs: _insert_owner, _select_owner_and_org, _update_owner_and_org, _delete_owner
--    - applications: _insert_owner, _select_owner_and_org, _update_org_only, _delete_owner_and_org
-- ============================================================================
