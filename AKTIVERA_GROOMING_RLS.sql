-- ============================================
-- AKTIVERA RLS FÖR GROOMING-TABELLER
-- ============================================
-- Datum: 3 Dec 2025
-- Syfte: Säkerställa multi-tenant isolation för grooming-modulen
-- Kör: I Supabase SQL Editor FÖRE production deploy

-- ⚠️ VARNING: Kör INTE denna SQL i DEV om du behöver debugga utan RLS!
-- I dev kan RLS vara avstängt för enklare debugging.

-- ============================================
-- 1. AKTIVERA RLS
-- ============================================

ALTER TABLE grooming_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE grooming_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE grooming_prices ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. GROOMING_BOOKINGS POLICIES
-- ============================================

-- SELECT: Användare kan se bokningar i sin organisation
CREATE POLICY "Users can view grooming bookings in their org"
ON grooming_bookings
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- INSERT: Användare kan skapa bokningar i sin organisation
CREATE POLICY "Users can insert grooming bookings in their org"
ON grooming_bookings
FOR INSERT
TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- UPDATE: Användare kan uppdatera bokningar i sin organisation
CREATE POLICY "Users can update grooming bookings in their org"
ON grooming_bookings
FOR UPDATE
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- DELETE: Användare kan radera bokningar i sin organisation
CREATE POLICY "Users can delete grooming bookings in their org"
ON grooming_bookings
FOR DELETE
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================
-- 3. GROOMING_JOURNAL POLICIES
-- ============================================

-- SELECT: Användare kan se journalanteckningar i sin organisation
CREATE POLICY "Users can view grooming journal in their org"
ON grooming_journal
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- INSERT: Användare kan skapa journalanteckningar i sin organisation
CREATE POLICY "Users can insert grooming journal in their org"
ON grooming_journal
FOR INSERT
TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- UPDATE: Användare kan uppdatera journalanteckningar i sin organisation
CREATE POLICY "Users can update grooming journal in their org"
ON grooming_journal
FOR UPDATE
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

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
-- 4. GROOMING_PRICES POLICIES
-- ============================================

-- SELECT: Användare kan se priser i sin organisation
CREATE POLICY "Users can view grooming prices in their org"
ON grooming_prices
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- INSERT: Användare kan skapa priser i sin organisation
CREATE POLICY "Users can insert grooming prices in their org"
ON grooming_prices
FOR INSERT
TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- UPDATE: Användare kan uppdatera priser i sin organisation
CREATE POLICY "Users can update grooming prices in their org"
ON grooming_prices
FOR UPDATE
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- DELETE: Användare kan radera priser i sin organisation
CREATE POLICY "Users can delete grooming prices in their org"
ON grooming_prices
FOR DELETE
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- ============================================
-- 5. VERIFIERA RLS STATUS
-- ============================================

SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('grooming_bookings', 'grooming_journal', 'grooming_prices')
ORDER BY tablename;

-- Förväntat resultat:
-- tablename           | RLS Enabled
-- -------------------|------------
-- grooming_bookings  | true
-- grooming_journal   | true
-- grooming_prices    | true

-- ============================================
-- 6. VERIFIERA POLICIES
-- ============================================

SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('grooming_bookings', 'grooming_journal', 'grooming_prices')
ORDER BY tablename, policyname;

-- Förväntat resultat: 12 policies totalt (4 per tabell)
-- - SELECT, INSERT, UPDATE, DELETE för varje tabell

-- ============================================
-- 7. TESTA RLS (VALFRITT)
-- ============================================

-- Test 1: Försök läsa en annan orgs grooming_bookings (ska returnera 0 rows)
-- Kör som inloggad användare från Org A:
SELECT * FROM grooming_bookings WHERE org_id = 'annan-org-id';
-- Förväntat: 0 rows (RLS blockerar)

-- Test 2: Läs egen orgs grooming_bookings (ska fungera)
-- Kör som inloggad användare:
SELECT * FROM grooming_bookings WHERE org_id = (SELECT org_id FROM profiles WHERE id = auth.uid());
-- Förväntat: Alla bokningar från din org

-- ============================================
-- 8. ROLLBACK (om något går fel)
-- ============================================

-- Om du behöver stänga av RLS igen (t.ex. för debugging):
-- ⚠️ Kör ALDRIG i production!

-- ALTER TABLE grooming_bookings DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE grooming_journal DISABLE ROW LEVEL SECURITY;
-- ALTER TABLE grooming_prices DISABLE ROW LEVEL SECURITY;

-- ============================================
-- KLART!
-- ============================================

-- RLS är nu aktiverat för grooming-tabeller.
-- Multi-tenant isolation säkerställd.
-- Redo för production.
