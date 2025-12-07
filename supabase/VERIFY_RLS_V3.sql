-- ============================================================================
-- VERIFIERING: RLS V3 Status
-- ============================================================================
-- Kör detta efter att ha kört V3 för att verifiera att allt fungerar
-- ============================================================================

-- 1. Visa alla tabeller med RLS aktiverat
SELECT 
  tablename,
  CASE WHEN rowsecurity THEN '✅ RLS ON' ELSE '❌ RLS OFF' END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Visa antal policies per tabell
SELECT 
  tablename,
  COUNT(*) as policy_count,
  STRING_AGG(policyname, ', ') as policies
FROM pg_policies 
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;

-- 3. Verifiera att get_user_org_id() fungerar
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_user_org_id') 
    THEN '✅ get_user_org_id() EXISTS' 
    ELSE '❌ get_user_org_id() MISSING' 
  END as helper_function;

-- 4. Snabb sammanfattning
SELECT 
  (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public' AND rowsecurity = true) as tables_with_rls,
  (SELECT COUNT(DISTINCT tablename) FROM pg_policies WHERE schemaname = 'public') as tables_with_policies;
