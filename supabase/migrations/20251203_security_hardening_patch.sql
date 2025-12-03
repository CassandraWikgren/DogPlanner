-- ============================================================
-- SECURITY HARDENING PATCH (Final Fixes)
-- Date: 2025-12-03
-- Purpose: Complete the security hardening by addressing remaining gaps
-- - Force-enable RLS on boarding_prices and system_config
-- - Safely remove users_without_org from public (it still exposes auth.users)
-- - Set search_path on additional critical functions
-- - Create RLS audit view for ongoing monitoring
-- Notes: All operations check current state first
-- ============================================================

-- 1) Force-enable RLS on tables that still lack it
-- Check first if they exist and lack RLS
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOR tbl IN 
    SELECT c.relname 
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public' 
      AND c.relkind = 'r'
      AND c.relname IN ('boarding_prices', 'system_config')
      AND c.relrowsecurity = false
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    RAISE NOTICE 'RLS enabled on public.%', tbl;
  END LOOP;
END$$;

-- 2) Remove auth.users exposure via users_without_org
-- Only if it exists in public and references auth.users
DO $$
DECLARE
  view_def TEXT;
BEGIN
  -- Check if view exists in public and contains auth.users reference
  SELECT definition INTO view_def
  FROM pg_views 
  WHERE schemaname = 'public' AND viewname = 'users_without_org';
  
  IF FOUND AND view_def ILIKE '%auth.users%' THEN
    -- Create internal schema if missing
    IF NOT EXISTS (SELECT 1 FROM pg_namespace WHERE nspname = 'internal') THEN
      CREATE SCHEMA internal;
      RAISE NOTICE 'Created schema: internal';
    END IF;

    -- Create safer version in internal using only profiles
    CREATE OR REPLACE VIEW internal.users_without_org AS
    SELECT 
      p.user_id,
      p.id AS profile_id,
      p.created_at,
      p.full_name,
      p.email
    FROM public.profiles p
    WHERE p.org_id IS NULL
    ORDER BY p.created_at DESC;
    
    RAISE NOTICE 'Created internal.users_without_org (safe version)';

    -- Drop the unsafe public version
    DROP VIEW IF EXISTS public.users_without_org CASCADE;
    RAISE NOTICE 'Dropped unsafe public.users_without_org';
  ELSE
    RAISE NOTICE 'public.users_without_org does not exist or already safe';
  END IF;
END$$;

-- 3) Set search_path on additional critical functions
-- Only those that exist and don't already have it set
DO $$
DECLARE
  func_list TEXT[] := ARRAY[
    'handle_new_user',
    'generate_invoice_number',
    'calculate_invoice_total',
    'auto_generate_customer_number',
    'set_org_id_for_owners',
    'set_org_id_for_dogs',
    'set_org_id_for_invoices',
    'enforce_journal_retention',
    'verify_database_integrity',
    'get_table_counts',
    'lock_expired_trials',
    'send_trial_warning_emails',
    'auto_checkout_dogs',
    'gdpr_delete_user_data'
  ];
  func_name TEXT;
  func_exists BOOLEAN;
BEGIN
  FOREACH func_name IN ARRAY func_list
  LOOP
    -- Check if function exists
    SELECT EXISTS(
      SELECT 1 FROM pg_proc p
      JOIN pg_namespace n ON n.oid = p.pronamespace
      WHERE n.nspname = 'public' AND p.proname = func_name
    ) INTO func_exists;
    
    IF func_exists THEN
      BEGIN
        EXECUTE format('ALTER FUNCTION public.%I() SET search_path = public, pg_temp', func_name);
        RAISE NOTICE 'Set search_path for public.%', func_name;
      EXCEPTION 
        WHEN undefined_function THEN
          -- Function might have parameters, try without () or skip
          RAISE NOTICE 'Could not set search_path for % (might have params)', func_name;
        WHEN OTHERS THEN
          RAISE NOTICE 'Error setting search_path for %: %', func_name, SQLERRM;
      END;
    END IF;
  END LOOP;
END$$;

-- 4) Create RLS audit view for ongoing monitoring
CREATE OR REPLACE VIEW internal.rls_audit AS
SELECT 
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  (SELECT COUNT(*) 
   FROM pg_policy p 
   WHERE p.polrelid = c.oid) AS policy_count,
  CASE 
    WHEN c.relrowsecurity = false AND EXISTS(
      SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid
    ) THEN 'ERROR: Has policies but RLS disabled'
    WHEN c.relrowsecurity = false THEN 'WARNING: No RLS'
    WHEN c.relrowsecurity = true AND NOT EXISTS(
      SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid
    ) THEN 'WARNING: RLS enabled but no policies'
    ELSE 'OK'
  END AS status
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public' 
  AND c.relkind = 'r'
  AND c.relname NOT LIKE 'pg_%'
ORDER BY 
  CASE 
    WHEN c.relrowsecurity = false AND EXISTS(SELECT 1 FROM pg_policy p WHERE p.polrelid = c.oid) THEN 1
    WHEN c.relrowsecurity = false THEN 2
    ELSE 3
  END,
  c.relname;

COMMENT ON VIEW internal.rls_audit IS 
'RLS status audit for all public tables. Check regularly to ensure security compliance.';

-- 5) Grant access to internal views for service_role
-- (authenticated users should not access internal.* directly)
GRANT USAGE ON SCHEMA internal TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA internal TO service_role;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA internal TO service_role;

-- ============================================================
-- ✅ SECURITY HARDENING PATCH COMPLETE
-- ============================================================
-- Verify with:
--   SELECT * FROM internal.rls_audit WHERE status LIKE 'ERROR%' OR status LIKE 'WARNING%';
--   SELECT * FROM internal.users_without_org LIMIT 5;  -- (via service_role only)
--   SELECT schemaname, viewname FROM pg_views WHERE viewname = 'users_without_org';
-- 
-- Expected results:
-- - No errors in rls_audit
-- - users_without_org only exists in internal schema
-- - boarding_prices and system_config have RLS enabled
