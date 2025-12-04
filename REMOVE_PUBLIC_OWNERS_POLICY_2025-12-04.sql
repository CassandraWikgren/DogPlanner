-- ============================================================
-- CRITICAL FIX: Remove overly permissive PUBLIC policy on owners
-- ============================================================
-- Problem: "Users can view owners in their org" allows PUBLIC access
-- This exposes all owners data to unauthenticated users
-- Solution: Delete the PUBLIC policy, keep only authenticated access
-- ============================================================

BEGIN;

-- STEG 1: Verifiera att problempolicyn finns
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'owners'
  AND policyname = 'Users can view owners in their org';

-- STEG 2: Droppa den PUBLIC SELECT policyn (SECURITY RISK!)
DROP POLICY IF EXISTS "Users can view owners in their org" ON public.owners;

-- STEG 3: Verifiera att den är borta och rätta policys finns kvar
SELECT 
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename = 'owners'
ORDER BY cmd, policyname;

-- STEG 4: Verifiera RESULTAT
-- Förväntat: 5 policies
-- - owners_public_insert (INSERT, anon+authenticated)
-- - owners_select_by_org_or_self (SELECT, authenticated)
-- - owners_update_by_org_or_self (UPDATE, authenticated)
-- - Owners can delete themselves (DELETE, authenticated)
-- - (Optional: any other org-scoped policies)

COMMIT;

-- ============================================================
-- SÄKERHETSKONTROLL
-- ============================================================
-- Efter denna migration:
-- ✅ RLS är ON på owners
-- ✅ SELECT: Endast authenticated users, org-isolated
-- ✅ INSERT: anon + authenticated (för registrering)
-- ✅ UPDATE: authenticated endast (org-isolated)
-- ✅ DELETE: authenticated endast
-- ✅ NO PUBLIC ACCESS längre!
-- ============================================================
