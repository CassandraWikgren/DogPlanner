-- ============================================================
-- Migration: Fix owners table RLS policies
-- Date: 4 December 2025
-- ============================================================
-- Problem: Overly permissive PUBLIC SELECT policy exposed all owners
-- Solution: Removed public policy, kept only authenticated org-scoped access
-- ============================================================

BEGIN;

-- Remove overly permissive public SELECT policy
DROP POLICY IF EXISTS "Users can view owners in their org" ON public.owners;

-- Verify correct policies remain
-- Expected: 4 policies (INSERT, SELECT, UPDATE, DELETE)
-- All except INSERT should be org-scoped to authenticated users only

COMMIT;
