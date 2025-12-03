-- ============================================
-- FIX GROOMING_JOURNAL - LÄGG TILL SAKNAD POLICY
-- ============================================
-- Datum: 3 Dec 2025
-- Syfte: grooming_journal har 3 policies istället för 4
-- Kör: I Supabase SQL Editor

-- ============================================
-- 1. KOLLA VILKA POLICIES SOM FINNS
-- ============================================

SELECT
  policyname,
  cmd as "Operation"
FROM pg_policies
WHERE tablename = 'grooming_journal'
ORDER BY cmd;

-- ============================================
-- 2. LÄGG TILL SAKNAD POLICY (troligtvis DELETE)
-- ============================================

-- Ta bort policy om den finns (för att undvika fel)
DROP POLICY IF EXISTS "Users can delete grooming journal in their org" ON grooming_journal;

-- DELETE: Användare kan radera journalanteckningar i sin organisation (GDPR)
CREATE POLICY "Users can delete grooming journal in their org"
ON grooming_journal
FOR DELETE
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================
-- 3. VERIFIERA ATT DET NU ÄR 4 POLICIES
-- ============================================

SELECT
  tablename,
  COUNT(*) as "Antal policies"
FROM pg_policies
WHERE tablename = 'grooming_journal'
GROUP BY tablename;

-- Förväntat resultat: 4 policies
