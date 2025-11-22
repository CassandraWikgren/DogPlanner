-- ============================================================
-- FIX: Public Interest Applications (Anonym insättning)
-- ============================================================
-- Problem: Publika ansökningar kan inte skapas pga RLS kräver auth.uid()
-- Lösning: Lägg till policy för anonym INSERT med anon-nyckel
-- ============================================================

BEGIN;

-- Lägg till policy för anonym INSERT (från publika formulär)
-- Denna tillåter INSERT utan auth.uid() så länge man använder anon-nyckel
CREATE POLICY "Allow anonymous insert for public applications"
ON interest_applications
FOR INSERT
TO anon
WITH CHECK (true);

-- Alternativt: Om du vill ha mer kontroll, lägg till validering
-- CREATE POLICY "Allow anonymous insert for public applications"
-- ON interest_applications  
-- FOR INSERT
-- TO anon
-- WITH CHECK (
--   parent_email IS NOT NULL AND 
--   parent_name IS NOT NULL AND
--   dog_name IS NOT NULL AND
--   org_id IS NOT NULL
-- );

COMMIT;

-- ============================================================
-- VERIFIERING
-- ============================================================

-- Visa alla policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN cmd = 'SELECT' THEN '👁️ Read'
    WHEN cmd = 'INSERT' THEN '➕ Create'
    WHEN cmd = 'UPDATE' THEN '✏️ Update'
    WHEN cmd = 'DELETE' THEN '🗑️ Delete'
    ELSE cmd
  END as action
FROM pg_policies 
WHERE tablename = 'interest_applications'
ORDER BY cmd, policyname;
