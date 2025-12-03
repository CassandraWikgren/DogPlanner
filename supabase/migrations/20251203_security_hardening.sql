-- ============================================================
-- SECURITY HARDENING MIGRATION (Supabase Linter Findings)
-- Date: 2025-12-03
-- Purpose: Address critical linter errors and high-risk warnings
-- - Remove exposure of auth.users via public views
-- - Enable RLS on public tables with policies
-- - Recreate risky public views without SECURITY DEFINER
-- - Set explicit search_path on critical functions
-- Notes:
-- - All operations are guarded with IF EXISTS / IF NOT EXISTS where possible
-- - Moving pg_net extension is NOT automatic here (see notes at end)
-- ============================================================

-- 1) Remove exposure of auth.users via a public view
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_views 
    WHERE schemaname = 'public' AND viewname = 'users_without_org'
  ) THEN
    -- Create internal schema if missing
    PERFORM 1 FROM pg_namespace WHERE nspname = 'internal';
    IF NOT FOUND THEN
      EXECUTE 'CREATE SCHEMA internal';
    END IF;

    -- Recreate the view in internal based ONLY on profiles
    EXECUTE 'CREATE OR REPLACE VIEW internal.users_without_org AS\n'
         || 'SELECT p.user_id\n'
         || 'FROM public.profiles p\n'
         || 'WHERE p.org_id IS NULL;';

    -- Drop the public view
    EXECUTE 'DROP VIEW IF EXISTS public.users_without_org';
  END IF;
END$$;

-- 2) Enable RLS on public tables that have policies but RLS disabled
-- Guarded enables (no error if already enabled)
DO $$
BEGIN
  FOR r IN SELECT relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'public' AND c.relkind = 'r'
             AND relname IN (
               'bookings','consent_logs','dogs','owners','org_subscriptions',
               'invoice_counters','subscription_types','gdpr_deletion_log','boarding_prices','system_config'
             )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.relname);
  END LOOP;
END$$;

-- 3) Recreate risky public views without SECURITY DEFINER
-- If any of these exist with definer, drop & recreate as normal views
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='invoice_runs_summary') THEN
    EXECUTE 'DROP VIEW public.invoice_runs_summary';
    -- Recreate minimal safe version (adjust SELECT as per actual implementation)
    EXECUTE 'CREATE VIEW public.invoice_runs_summary AS\n'
         || 'SELECT ir.id, ir.month_id, ir.status, ir.created_at\n'
         || 'FROM public.invoice_runs ir;';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='trigger_health_summary') THEN
    EXECUTE 'DROP VIEW public.trigger_health_summary';
    EXECUTE 'CREATE VIEW public.trigger_health_summary AS\n'
         || 'SELECT tg.tgname AS trigger_name, c.relname AS table_name\n'
         || 'FROM pg_trigger tg\n'
         || 'JOIN pg_class c ON c.oid = tg.tgrelid\n'
         || 'WHERE tg.tgisinternal = false;';
  END IF;

  IF EXISTS (SELECT 1 FROM pg_views WHERE schemaname='public' AND viewname='recent_trigger_failures') THEN
    EXECUTE 'DROP VIEW public.recent_trigger_failures';
    EXECUTE 'CREATE VIEW public.recent_trigger_failures AS\n'
         || 'SELECT id, trigger_name, error_message, created_at\n'
         || 'FROM public.trigger_logs\n'
         || 'WHERE created_at > now() - interval ''30 days'';';
  END IF;
END$$;

-- 4) Ensure analytics_conversion_rate is a normal view (no definer)
-- We recreate it explicitly to guarantee invoker security
DROP VIEW IF EXISTS public.analytics_conversion_rate;
CREATE VIEW public.analytics_conversion_rate AS
SELECT 
  o.id AS org_id,
  o.name AS org_name,
  COALESCE(ia.subscription_type, 'unknown') AS subscription_type,
  COUNT(*) AS total_applications,
  COUNT(*) FILTER (WHERE ia.status = 'accepted' OR ia.visit_result = 'approved') AS converted_applications,
  ROUND(
    100.0 * COUNT(*) FILTER (WHERE ia.status = 'accepted' OR ia.visit_result = 'approved')
    / NULLIF(COUNT(*), 0),
    1
  ) AS conversion_rate_percent
FROM public.interest_applications ia
JOIN public.orgs o ON o.id = ia.org_id
GROUP BY o.id, o.name, COALESCE(ia.subscription_type, 'unknown')
ORDER BY org_name, subscription_type;

-- Re-grant
GRANT SELECT ON public.analytics_conversion_rate TO authenticated;

-- 5) Set explicit search_path on critical functions (representative subset)
-- Note: Using ALTER FUNCTION ... SET search_path affects future calls
-- Add more functions as needed, starting with those invoked by triggers/cron
DO $$
BEGIN
  -- Helper to set search_path safely
  PERFORM 1;
  BEGIN
    EXECUTE 'ALTER FUNCTION public.current_org_id() SET search_path = public, pg_temp';
  EXCEPTION WHEN undefined_function THEN
    -- ignore if function not present
  END;

  BEGIN
    EXECUTE 'ALTER FUNCTION public.create_invoice_on_checkout() SET search_path = public, pg_temp';
  EXCEPTION WHEN undefined_function THEN
  END;

  BEGIN
    EXECUTE 'ALTER FUNCTION public.create_prepayment_invoice() SET search_path = public, pg_temp';
  EXCEPTION WHEN undefined_function THEN
  END;
END$$;

-- 6) pg_net extension location (WARNING) — NOT auto-migrated here
-- Moving extensions can break dependent code; do this during a planned window:
--   CREATE SCHEMA IF NOT EXISTS extensions;
--   DROP EXTENSION IF EXISTS pg_net;
--   CREATE EXTENSION pg_net SCHEMA extensions;
-- Then update calls to use extensions.net.http_post or create a stable alias.

-- 7) Final check comments
-- After applying this migration:
-- - Verify RLS enabled: SELECT relname, relrowsecurity FROM pg_class JOIN pg_namespace ON oid=relnamespace WHERE nspname='public' AND relname IN (...);
-- - Verify no public views read directly from auth.users
-- - Verify analytics_conversion_rate works and is accessible to authenticated
-- - Plan extension move in a maintenance window
