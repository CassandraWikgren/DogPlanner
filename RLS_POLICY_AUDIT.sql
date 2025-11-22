-- =====================================================
-- RLS POLICY AUDIT & CLEANUP ANALYSIS
-- =====================================================
-- Syfte: Identifiera överlappande och duplicerade RLS policies
-- Datum: 2025-11-22
-- =====================================================

-- =====================================================
-- 1. ÖVERSIKT: Policies per tabell
-- =====================================================
SELECT 
  schemaname,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) > 10 THEN '🔴 VERY HIGH - Risk för konflikter'
    WHEN COUNT(*) > 5 THEN '🟡 HIGH - Bör granskas'
    WHEN COUNT(*) > 3 THEN '🟢 MODERATE - OK'
    ELSE '✅ LOW - Bra'
  END as risk_level
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
ORDER BY COUNT(*) DESC;

-- =====================================================
-- 2. DETALJERAD LISTA: extra_service (11 policies!)
-- =====================================================
SELECT 
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual IS NOT NULL THEN 'USING: ' || substring(qual, 1, 100)
    ELSE 'No USING clause'
  END as using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'extra_service'
ORDER BY cmd, policyname;

-- =====================================================
-- 3. IDENTIFIERA DUPLICERADE SELECT POLICIES
-- =====================================================
-- Policies som gör samma sak (SELECT för samma tabell)
WITH select_policies AS (
  SELECT 
    tablename,
    policyname,
    cmd,
    qual,
    ROW_NUMBER() OVER (PARTITION BY tablename, cmd, qual ORDER BY policyname) as rn
  FROM pg_policies
  WHERE schemaname = 'public'
    AND cmd = 'SELECT'
)
SELECT 
  tablename,
  COUNT(*) as duplicate_select_policies,
  array_agg(policyname) as policy_names
FROM select_policies
WHERE rn > 1
GROUP BY tablename
ORDER BY COUNT(*) DESC;

-- =====================================================
-- 4. ALLA TABELLER MED >5 POLICIES
-- =====================================================
SELECT 
  p.tablename,
  p.policyname,
  p.cmd as operation,
  p.roles,
  substring(COALESCE(p.qual, 'No USING'), 1, 80) as using_clause_preview
FROM pg_policies p
WHERE p.schemaname = 'public'
  AND p.tablename IN (
    SELECT tablename 
    FROM pg_policies 
    WHERE schemaname = 'public'
    GROUP BY tablename 
    HAVING COUNT(*) > 5
  )
ORDER BY p.tablename, p.cmd, p.policyname;

-- =====================================================
-- 5. SPECIFIK ANALYS: dog_journal (många policies)
-- =====================================================
SELECT 
  '=== dog_journal policies ===' as section,
  policyname,
  cmd,
  substring(qual, 1, 100) as using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'dog_journal'
ORDER BY cmd, policyname;

-- =====================================================
-- 6. SPECIFIK ANALYS: subscriptions (många policies)
-- =====================================================
SELECT 
  '=== subscriptions policies ===' as section,
  policyname,
  cmd,
  substring(qual, 1, 100) as using_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'subscriptions'
ORDER BY cmd, policyname;

-- =====================================================
-- 7. REKOMMENDERADE CLEANUP ACTIONS
-- =====================================================
-- VARNING: KÖR INTE DESSA UTAN ATT GRANSKA FÖRST!
-- Detta är bara exempel på vad som KAN behövas

-- Exempel: extra_service har många duplicerade policies
-- STEG 1: Identifiera vilka som faktiskt används
SELECT 
  tablename,
  policyname,
  cmd,
  'Potential duplicate - Review before dropping' as note
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'extra_service'
  AND cmd = 'SELECT'
  AND policyname IN (
    'Org members can read org extra_service',
    'extra_service_select',
    'select_own_org',
    'allow_select_extra_service'
  );

-- =====================================================
-- 8. POLICY PATTERN ANALYS
-- =====================================================
-- Vilka patterns används mest?
SELECT 
  CASE 
    WHEN qual LIKE '%auth.uid()%' THEN 'Uses auth.uid() pattern'
    WHEN qual LIKE '%profiles.org_id%' THEN 'Uses profiles.org_id JOIN pattern'
    WHEN qual LIKE '%current_org_id()%' THEN 'Uses current_org_id() function'
    WHEN qual = 'true' THEN 'Open access (true)'
    ELSE 'Other pattern'
  END as policy_pattern,
  COUNT(*) as policy_count,
  array_agg(DISTINCT tablename) as example_tables
FROM pg_policies
WHERE schemaname = 'public'
  AND qual IS NOT NULL
GROUP BY policy_pattern
ORDER BY COUNT(*) DESC;

-- =====================================================
-- 9. SÄKERHETSANALYS: Tabeller med open access
-- =====================================================
-- Policies som tillåter allt (qual = 'true')
SELECT 
  tablename,
  policyname,
  cmd,
  roles,
  '⚠️ OPEN ACCESS - Review security' as warning
FROM pg_policies
WHERE schemaname = 'public'
  AND (qual = 'true' OR with_check = 'true')
ORDER BY tablename, cmd;

-- =====================================================
-- 10. REKOMMENDATIONER
-- =====================================================
SELECT 
  '=== CLEANUP RECOMMENDATIONS ===' as summary,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'extra_service') as extra_service_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'dog_journal') as dog_journal_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'subscriptions') as subscriptions_policies,
  (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'public' AND (qual = 'true' OR with_check = 'true')) as open_access_policies;

-- =====================================================
-- NÄSTA STEG
-- =====================================================
/*
1. Kör denna fil i Supabase SQL Editor
2. Granska resultaten från sektion 1-4
3. För varje tabell med >5 policies:
   a. Identifiera duplicerade policies
   b. Välj den mest specifika att behålla
   c. Testa i staging att inga funktioner bryts
   d. Droppa duplicerade policies

4. Exempel på cleanup (TESTA FÖRST I STAGING!):

   -- För extra_service, behåll bara dessa två:
   DROP POLICY IF EXISTS "allow_select_extra_service" ON extra_service;
   DROP POLICY IF EXISTS "Org members can read org extra_service" ON extra_service;
   -- Behåll: "extra_service_select" och "select_own_org"

5. Dokumentera alla ändringar i en ny migration-fil
6. Kör HEALTH_CHECK.sql efter cleanup

VIKTIGT: Gör alltid backup innan du droppar policies!
*/
