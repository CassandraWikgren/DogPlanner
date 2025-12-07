-- ============================================
-- KOLLA GROOMING RLS STATUS
-- ============================================
-- Datum: 3 Dec 2025
-- Syfte: Verifiera om RLS och policies redan finns

-- ============================================
-- 1. KOLLA RLS STATUS
-- ============================================

SELECT
  schemaname,
  tablename,
  rowsecurity as "RLS Enabled"
FROM pg_tables
WHERE tablename IN ('grooming_bookings', 'grooming_journal', 'grooming_prices')
ORDER BY tablename;

-- ============================================
-- 2. KOLLA BEFINTLIGA POLICIES
-- ============================================

SELECT
  schemaname,
  tablename,
  policyname,
  cmd as "Operation",
  CASE 
    WHEN roles = '{authenticated}' THEN 'authenticated'
    WHEN roles = '{anon}' THEN 'anon'
    ELSE roles::text
  END as "Role"
FROM pg_policies
WHERE tablename IN ('grooming_bookings', 'grooming_journal', 'grooming_prices')
ORDER BY tablename, policyname;

-- ============================================
-- 3. RÄKNA POLICIES PER TABELL
-- ============================================

SELECT
  tablename,
  COUNT(*) as "Antal policies"
FROM pg_policies
WHERE tablename IN ('grooming_bookings', 'grooming_journal', 'grooming_prices')
GROUP BY tablename
ORDER BY tablename;

-- Förväntat om policies finns:
-- grooming_bookings: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- grooming_journal: 4 policies
-- grooming_prices: 4 policies
