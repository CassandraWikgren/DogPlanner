-- ================================================================
-- MIGRATION: Add Admin Send Invoice Policy
-- Skapad: 2025-11-22
-- Syfte: Endast admin kan skicka fakturor (ändra draft → sent)
-- ================================================================

-- Ta bort gammal policy om den finns
DROP POLICY IF EXISTS "admin_can_send_invoices" ON invoices;

-- Skapa ny policy: Endast admin kan skicka fakturor
CREATE POLICY "admin_can_send_invoices" 
ON invoices 
FOR UPDATE 
TO authenticated
USING (
  -- Måste vara admin i organisationen
  EXISTS (
    SELECT 1 
    FROM profiles
    WHERE profiles.id = auth.uid()
      AND profiles.org_id = invoices.org_id
      AND profiles.role = 'admin'
  )
  -- OCH fakturan måste vara draft (förhindrar omsändning)
  AND status = 'draft'
);

-- Lägg till dokumentation
COMMENT ON POLICY "admin_can_send_invoices" ON invoices IS 
'Endast admin kan uppdatera fakturor från draft till sent. Staff kan inte skicka fakturor.';

-- ================================================================
-- VERIFIERA DEPLOYMENT
-- ================================================================

-- Kontrollera att policyn skapades
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  roles
FROM pg_policies
WHERE tablename = 'invoices' 
  AND policyname = 'admin_can_send_invoices';

-- ================================================================
-- SÄKERHETSANALYS
-- ================================================================

-- Se alla policies för invoices-tabellen
SELECT 
  policyname,
  cmd as operation,
  roles,
  CASE 
    WHEN policyname = 'admin_can_send_invoices' THEN '🔒 Admin-only send policy'
    WHEN policyname = 'update_invoices_in_org' THEN '✏️ General update in org'
    WHEN policyname = 'select_invoices_in_org' THEN '👁️ View in org'
    WHEN policyname = 'insert_invoices_in_org' THEN '➕ Create in org'
    ELSE '❓ Other policy'
  END as policy_type
FROM pg_policies
WHERE tablename = 'invoices'
ORDER BY cmd, policyname;

-- ================================================================
-- ROLLBACK (om något går fel)
-- ================================================================

-- Om du behöver ta bort policyn:
-- DROP POLICY IF EXISTS "admin_can_send_invoices" ON invoices;
