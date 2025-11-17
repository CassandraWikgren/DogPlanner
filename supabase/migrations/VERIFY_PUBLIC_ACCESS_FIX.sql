-- ============================================================================
-- VERIFICATION SCRIPT FOR PUBLIC ACCESS FIX
-- ============================================================================
-- Run this AFTER applying 20251117_COMPLETE_PUBLIC_ACCESS_FIX.sql
-- This will show you the status of all RLS policies and help debug issues
-- ============================================================================

-- 1. Check which tables have RLS enabled
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'owners', 
    'dogs', 
    'bookings', 
    'interest_applications', 
    'consent_logs', 
    'dog_journal',
    'orgs'
  )
ORDER BY tablename;

-- Expected result: All should show rls_enabled = true

-- 2. List all policies for application-related tables
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
WHERE schemaname = 'public' 
  AND tablename IN (
    'owners', 
    'dogs', 
    'bookings', 
    'interest_applications', 
    'consent_logs', 
    'dog_journal',
    'orgs'
  )
ORDER BY tablename, policyname;

-- Expected result: Should see policies like:
-- - "Allow public to create X" for INSERT
-- - "Allow org members to view their X" for SELECT
-- - etc.

-- 3. Check triggers that might use auth.uid()
SELECT 
  event_object_table as table_name,
  trigger_name,
  action_timing,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'public'
  AND event_object_table IN (
    'owners', 
    'dogs', 
    'bookings', 
    'interest_applications'
  )
ORDER BY event_object_table, trigger_name;

-- 4. Test public INSERT permissions (as anonymous user simulation)
-- This should return TRUE if policies are correct
SELECT 
  has_table_privilege('anon', 'owners', 'INSERT') as owners_insert,
  has_table_privilege('anon', 'dogs', 'INSERT') as dogs_insert,
  has_table_privilege('anon', 'bookings', 'INSERT') as bookings_insert,
  has_table_privilege('anon', 'interest_applications', 'INSERT') as interest_insert,
  has_table_privilege('anon', 'consent_logs', 'INSERT') as consent_insert,
  has_table_privilege('anon', 'orgs', 'SELECT') as orgs_select;

-- Expected result: All should be TRUE

-- 5. Check for any triggers that might fail without auth.uid()
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND pg_get_functiondef(p.oid) LIKE '%auth.uid()%'
  AND p.proname LIKE '%dog%';

-- Look for functions that use auth.uid() without NULL checks

-- ============================================================================
-- TROUBLESHOOTING GUIDE
-- ============================================================================

-- If RLS is not enabled for a table:
-- ALTER TABLE tablename ENABLE ROW LEVEL SECURITY;

-- If policies are missing:
-- Re-run the 20251117_COMPLETE_PUBLIC_ACCESS_FIX.sql migration

-- If you see "new row violates row-level security policy":
-- Check that the INSERT policy exists and has WITH CHECK (true)

-- If you see "JSON object requested, multiple (or no) rows returned":
-- Check triggers on that table - they might be failing silently
-- Look for triggers using auth.uid() without NULL checks

-- To manually test an insert as anonymous user:
-- SET ROLE anon;
-- INSERT INTO interest_applications (org_id, parent_name, ...) VALUES (...);
-- RESET ROLE;

-- ============================================================================
-- SUMMARY CHECKS
-- ============================================================================

-- Count policies per table (should be 2-4 per table)
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN (
    'owners', 
    'dogs', 
    'bookings', 
    'interest_applications', 
    'consent_logs', 
    'dog_journal',
    'orgs'
  )
GROUP BY tablename
ORDER BY tablename;

-- Final status message
DO $$
DECLARE
  rls_count INTEGER;
  policy_count INTEGER;
BEGIN
  -- Count tables with RLS enabled
  SELECT COUNT(*) INTO rls_count
  FROM pg_tables 
  WHERE schemaname = 'public' 
    AND tablename IN ('owners', 'dogs', 'bookings', 'interest_applications', 'consent_logs', 'orgs')
    AND rowsecurity = true;
  
  -- Count total policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE schemaname = 'public' 
    AND tablename IN ('owners', 'dogs', 'bookings', 'interest_applications', 'consent_logs', 'orgs');
  
  RAISE NOTICE '============================================';
  RAISE NOTICE 'PUBLIC ACCESS FIX VERIFICATION COMPLETE';
  RAISE NOTICE '============================================';
  RAISE NOTICE 'Tables with RLS enabled: % / 6', rls_count;
  RAISE NOTICE 'Total RLS policies created: %', policy_count;
  RAISE NOTICE '';
  
  IF rls_count = 6 AND policy_count >= 18 THEN
    RAISE NOTICE '✅ SUCCESS: All tables configured correctly!';
    RAISE NOTICE '';
    RAISE NOTICE 'Public applications should now work:';
    RAISE NOTICE '  ✓ Pension applications (/ansokan/pensionat)';
    RAISE NOTICE '  ✓ Daycare applications (/ansokan/hunddagis)';
  ELSE
    RAISE NOTICE '⚠️  WARNING: Some tables may not be configured correctly';
    RAISE NOTICE 'Expected: 6 tables with RLS, 18+ policies';
    RAISE NOTICE 'Found: % tables with RLS, % policies', rls_count, policy_count;
    RAISE NOTICE '';
    RAISE NOTICE 'Run the migration again or check for errors above.';
  END IF;
  
  RAISE NOTICE '============================================';
END $$;
