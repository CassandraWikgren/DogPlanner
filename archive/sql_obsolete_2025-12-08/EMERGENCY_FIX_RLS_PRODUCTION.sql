-- ============================================================
-- 🚨 EMERGENCY: Stäng av RLS på special_dates och boarding_seasons
-- ============================================================
-- KÖR DETTA I SUPABASE SQL EDITOR (PRODUCTION DATABASE)
-- 
-- Problem: 406-fel i UI pga RLS blockerar queries
-- Lösning: Stäng av RLS temporary (enable med policies senare)
-- ============================================================

-- Kolla nuvarande RLS-status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('special_dates', 'boarding_seasons')
ORDER BY tablename;

-- Stäng av RLS
ALTER TABLE public.special_dates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.boarding_seasons DISABLE ROW LEVEL SECURITY;

-- Verifiera att RLS är avstängt
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '❌ RLS PÅ (blockerar)' ELSE '✅ RLS AV (funkar)' END as status
FROM pg_tables 
WHERE tablename IN ('special_dates', 'boarding_seasons')
ORDER BY tablename;

-- Kolla att tabellerna har data
SELECT 'special_dates' as table_name, COUNT(*) as row_count FROM special_dates
UNION ALL
SELECT 'boarding_seasons' as table_name, COUNT(*) as row_count FROM boarding_seasons;

-- ============================================================
-- FÖRVÄNTAT RESULTAT:
-- 
-- special_dates    | false | ✅ RLS AV (funkar)
-- boarding_seasons | false | ✅ RLS AV (funkar)
-- 
-- special_dates    | 7030 rows (eller liknande)
-- boarding_seasons | 2 rows (eller liknande)
-- ============================================================
