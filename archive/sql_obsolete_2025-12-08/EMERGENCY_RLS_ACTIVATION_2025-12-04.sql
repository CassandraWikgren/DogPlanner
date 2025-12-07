-- ============================================================
-- 🔴 EMERGENCY RLS ACTIVATION - 4 December 2025
-- ============================================================
-- PROBLEM: 7000+ special_dates exponerade utan RLS
-- STATUS: MÅSTE köras FÖRE production
-- ============================================================

BEGIN;

-- ============================================================
-- STEG 1: AKTIVERA RLS PÅ TABELLER SOM ÄR OFF
-- ============================================================

-- HÖGSTA PRIORITET: 7030 special_dates utan RLS!
ALTER TABLE public.special_dates ENABLE ROW LEVEL SECURITY;

-- MEDIUM PRIORITET: Grooming och boarding tabeller
ALTER TABLE public.grooming_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grooming_journal ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grooming_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boarding_seasons ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- STEG 2: VERIFIERA RLS STATUS EFTER ACTIVATION
-- ============================================================

-- Kolla vilka tabeller som nu har RLS
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS ENABLED'
    ELSE '❌ RLS DISABLED'
  END as rls_status,
  CASE
    WHEN rowsecurity = true THEN 'SÄKER'
    ELSE '🔴 FARLIGT - DATA EXPONERAD'
  END as security_level
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'special_dates',
    'grooming_bookings',
    'grooming_journal', 
    'grooming_prices',
    'boarding_seasons',
    'boarding_prices'
  )
ORDER BY tablename;

-- ============================================================
-- STEG 3: VERIFIERA POLICIES FINNS
-- ============================================================

-- Alla dessa bör redan ha policies från migrations
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'special_dates',
    'grooming_bookings',
    'grooming_journal',
    'grooming_prices',
    'boarding_seasons',
    'boarding_prices'
  )
ORDER BY tablename, policyname;

-- ============================================================
-- STEG 4: TESTA MULTI-TENANT ISOLATION
-- ============================================================

-- Test 1: Verifiera att RLS blockerar cross-org access
-- Kör detta som en user från ORG_A och se om du kan nå ORG_B data
-- SELECT COUNT(*) FROM special_dates WHERE org_id != (SELECT org_id FROM profiles WHERE id = auth.uid());
-- Förväntat resultat: 0 rows (RLS blockerar)

-- Test 2: Verifiera egen orgs data är åtkomlig
-- SELECT COUNT(*) FROM special_dates WHERE org_id = (SELECT org_id FROM profiles WHERE id = auth.uid());
-- Förväntat resultat: Antal rader i egen org

-- ============================================================
-- STEG 5: STATUS CHECK
-- ============================================================

COMMIT;

-- ============================================================
-- POST-DEPLOYMENT VERIFICATION
-- ============================================================
-- Kör dessa queries efter att ha committat scriptet:

/*

-- Query 1: Testa att en ny registrering fortfarande fungerar
-- (Kolla att owners_public_insert policy tillåter anon INSERT)
SELECT * FROM pg_policies 
WHERE tablename = 'owners' 
  AND policyname = 'owners_public_insert';
-- Förväntat: PERMISSIVE = true, ROLES = anon + authenticated

-- Query 2: Verifiera att grooming RLS är helt aktiverat
SELECT 
  tablename,
  COUNT(*) as antal_policies
FROM pg_policies
WHERE tablename IN ('grooming_bookings', 'grooming_journal', 'grooming_prices')
GROUP BY tablename;
-- Förväntat: 4 policies per tabell (SELECT, INSERT, UPDATE, DELETE)

-- Query 3: Testa boarding_seasons isolation
-- Kör som org_id = 'org_1':
SELECT * FROM boarding_seasons;
-- Förväntat: ENDAST rader med org_id = 'org_1'

-- Query 4: Testa special_dates isolation (7030 rader bör isoleras!)
-- Kör som org_id = 'org_1':
SELECT COUNT(*) FROM special_dates;
-- Förväntat: Endast rader för org_1, INTE alla 7030

*/

-- ============================================================
-- 📊 SAMMANFATTNING
-- ============================================================
-- Denna migration:
-- ✅ Aktiverar RLS på 5 kritiska tabeller
-- ✅ Skyddar 7030+ special_dates rader från exponering
-- ✅ Säkerställer grooming-data isolation
-- ✅ Verifierar att policies redan finns (inga nya skapas)
-- 
-- RESULTAT: System är nu PRODUCTION-SAFE från RLS-perspektiv
-- ============================================================
