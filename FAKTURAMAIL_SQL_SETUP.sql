-- ================================================================
-- FAKTURAMAIL SETUP - SQL KOMMANDON
-- ================================================================
-- Kör dessa i Supabase SQL Editor EFTER deployment av Edge Function
-- Skapad: 2025-11-22
-- Syfte: Säkerhetspolicies för faktura-skickning
-- ================================================================

-- ================================================================
-- 1. RLS POLICY - Endast admin kan skicka fakturor
-- ================================================================
-- Säkerställer att bara admin i organisationen kan uppdatera
-- fakturor från draft till sent

-- Ta bort gammal policy om den finns
DROP POLICY IF EXISTS "admin_can_send_invoices" ON invoices;

-- Skapa ny policy
CREATE POLICY "admin_can_send_invoices"
ON invoices
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.org_id = invoices.org_id
    AND profiles.role = 'admin'
  )
  AND status = 'draft' -- Kan bara skicka draft-fakturor
);

COMMENT ON POLICY "admin_can_send_invoices" ON invoices IS
'Endast admin kan uppdatera fakturor från draft till sent';

-- ================================================================
-- 2. VERIFIERA SETUP (KÖR EFTER POLICY)
-- ================================================================

-- Kontrollera att policyn skapades
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
WHERE tablename = 'invoices' 
AND policyname = 'admin_can_send_invoices';

-- ================================================================
-- 3. TESTA ATT OWNER HAR EMAIL (INNAN DU SKICKAR FAKTURA)
-- ================================================================

-- Hitta alla draft-fakturor där ägaren SAKNAR email
SELECT
  i.id,
  i.invoice_number,
  i.total_amount,
  i.status,
  o.full_name AS owner_name,
  o.email AS owner_email,
  org.name AS company_name
FROM invoices i
LEFT JOIN owners o ON i.owner_id = o.id
LEFT JOIN orgs org ON i.org_id = org.id
WHERE i.status = 'draft'
AND (o.email IS NULL OR o.email = '');

-- Om denna query returnerar rader, lägg till email för dessa ägare först!

-- ================================================================
-- 4. HITTA EN TEST-FAKTURA ATT SKICKA
-- ================================================================

-- Hitta första draft-fakturan med email
SELECT
  i.id,
  i.invoice_number,
  i.total_amount,
  i.due_date,
  i.status,
  o.full_name AS owner_name,
  o.email AS owner_email,
  org.name AS company_name
FROM invoices i
LEFT JOIN owners o ON i.owner_id = o.id
LEFT JOIN orgs org ON i.org_id = org.id
WHERE i.status = 'draft'
AND o.email IS NOT NULL
AND o.email != ''
ORDER BY i.created_at DESC
LIMIT 1;

-- Kopiera 'id' från resultatet och använd i nästa steg!

-- ================================================================
-- 5. VERIFIERA EFTER SKICKAD FAKTURA
-- ================================================================

-- Kontrollera att status ändrades från draft → sent
SELECT
  i.id,
  i.invoice_number,
  i.status,
  i.sent_at,
  o.email AS recipient_email
FROM invoices i
LEFT JOIN owners o ON i.owner_id = o.id
WHERE i.invoice_number = 'FAKTURA_NUMMER_HÄR'  -- Byt ut
ORDER BY i.sent_at DESC;

-- Förväntat resultat:
-- status = 'sent'
-- sent_at = nyligen (några sekunder sedan)

-- ================================================================
-- 6. STATISTIK - Antal skickade fakturor
-- ================================================================

-- Se alla skickade fakturor (senaste 30 dagarna)
SELECT
  DATE(i.sent_at) AS sent_date,
  COUNT(*) AS antal_skickade,
  SUM(i.total_amount) AS total_belopp
FROM invoices i
WHERE i.status = 'sent'
AND i.sent_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY DATE(i.sent_at)
ORDER BY sent_date DESC;

-- ================================================================
-- 7. LÄGG TILL EMAIL TILL OWNER (OM SAKNAS)
-- ================================================================

-- Exempel: Uppdatera email för en specifik ägare
UPDATE owners
SET email = 'hundagare@example.com'  -- Byt till riktigt email
WHERE id = 'OWNER_ID_HÄR';  -- Byt till rätt ID

-- Verifiera uppdateringen
SELECT id, full_name, email, phone
FROM owners
WHERE id = 'OWNER_ID_HÄR';

-- ================================================================
-- 8. FELSÖKNING - Hitta fakturor som inte kunde skickas
-- ================================================================

-- Draft-fakturor äldre än 7 dagar (kanske borde skickas?)
SELECT
  i.id,
  i.invoice_number,
  i.created_at,
  i.total_amount,
  o.full_name,
  o.email,
  CASE 
    WHEN o.email IS NULL OR o.email = '' THEN '❌ Saknar email'
    ELSE '✅ Har email'
  END AS email_status
FROM invoices i
LEFT JOIN owners o ON i.owner_id = o.id
WHERE i.status = 'draft'
AND i.created_at < CURRENT_DATE - INTERVAL '7 days'
ORDER BY i.created_at DESC;

-- ================================================================
-- 9. ROLLBACK (OM NÅGOT GÅR FEL)
-- ================================================================

-- Ta bort policy om du vill ändra den
-- DROP POLICY IF EXISTS "admin_can_send_invoices" ON invoices;

-- Återställ faktura till draft (om du skickade fel faktura)
-- UPDATE invoices 
-- SET status = 'draft', sent_at = NULL
-- WHERE id = 'FAKTURA_ID_HÄR';

-- ================================================================
-- KLART! 
-- ================================================================
-- 
-- Nästa steg:
-- 1. ✅ Kör SQL #1 (CREATE POLICY)
-- 2. ✅ Kör SQL #2 (Verifiera policy)
-- 3. ✅ Kör SQL #3 (Hitta fakturor utan email)
-- 4. ✅ Kör SQL #4 (Hitta test-faktura)
-- 5. 🚀 Gå till /ekonomi och klicka "Skicka faktura"
-- 6. ✅ Kör SQL #5 (Verifiera att den skickades)
--
-- ================================================================
