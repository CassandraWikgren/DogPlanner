-- ============================================================
-- FIX: Interest Applications RLS Policy
-- ============================================================
-- Problem: RLS aktiverat men inga INSERT/UPDATE policies
-- Lösning: Lägg till policies som tillåter org-baserade operationer
-- ============================================================

BEGIN;

-- Ta bort RLS tillfälligt för att kunna lägga till policies
ALTER TABLE interest_applications DISABLE ROW LEVEL SECURITY;

-- Rensa eventuella gamla policies
DROP POLICY IF EXISTS "Users can view their org's interest applications" ON interest_applications;
DROP POLICY IF EXISTS "Users can insert interest applications for their org" ON interest_applications;
DROP POLICY IF EXISTS "Users can update their org's interest applications" ON interest_applications;
DROP POLICY IF EXISTS "Users can delete their org's interest applications" ON interest_applications;

-- ============================================================
-- NYA POLICIES - ORG-BASERAD ÅTKOMST
-- ============================================================

-- SELECT: Läs intresseanmälningar för egen organisation
CREATE POLICY "Users can view their org's interest applications"
ON interest_applications
FOR SELECT
USING (
  org_id IN (
    SELECT org_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- INSERT: Skapa nya intresseanmälningar för egen organisation
CREATE POLICY "Users can insert interest applications for their org"
ON interest_applications
FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT org_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- UPDATE: Uppdatera intresseanmälningar för egen organisation
CREATE POLICY "Users can update their org's interest applications"
ON interest_applications
FOR UPDATE
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

-- DELETE: Ta bort intresseanmälningar för egen organisation
CREATE POLICY "Users can delete their org's interest applications"
ON interest_applications
FOR DELETE
USING (
  org_id IN (
    SELECT org_id 
    FROM profiles 
    WHERE id = auth.uid()
  )
);

-- Aktivera RLS igen
ALTER TABLE interest_applications ENABLE ROW LEVEL SECURITY;

COMMIT;

-- ============================================================
-- VERIFIERING
-- ============================================================

SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'interest_applications'
ORDER BY policyname;

-- Visa RLS-status
SELECT 
  '✅ interest_applications' as table_name,
  CASE 
    WHEN relrowsecurity THEN '🔒 RLS ENABLED' 
    ELSE '⚠️ RLS DISABLED' 
  END as rls_status
FROM pg_class 
WHERE relname = 'interest_applications';
