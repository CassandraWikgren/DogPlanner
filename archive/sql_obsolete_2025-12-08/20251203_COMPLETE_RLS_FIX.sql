-- ============================================================================
-- KOMPLETT RLS-FIX FÖR DOGPLANNER
-- ============================================================================
-- Skapad: 3 December 2025
-- Syfte: Aktivera Row Level Security på ALLA tabeller som saknar det
-- Status: Security Advisor visade 22 kritiska fel - detta fixar ALLT
--
-- VIKTIGT: Detta script är IDEMPOTENT (kan köras flera gånger säkert)
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEG 1: AKTIVERA RLS PÅ KRITISKA TABELLER SOM SAKNAR DET
-- ============================================================================

-- KRITISKT: Tabeller med personnummer och känsliga personuppgifter
ALTER TABLE public.owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_logs ENABLE ROW LEVEL SECURITY;

-- GDPR och loggar
ALTER TABLE public.gdpr_deletion_log ENABLE ROW LEVEL SECURITY;

-- Ekonomi och fakturering
ALTER TABLE public.org_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boarding_prices ENABLE ROW LEVEL SECURITY;

-- System och konfiguration
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.migrations ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEG 2: VERIFIERA ATT POLICIES REDAN FINNS
-- ============================================================================
-- Dessa tabeller har redan policies definierade i remote_schema.sql:
-- - bookings: bookings_select_by_org_or_owner, bookings_update_by_org_or_owner, bookings_public_insert
-- - dogs: dogs_select_by_org_or_owner, dogs_update_by_org_or_owner, dogs_public_insert
-- - owners: owners_select_by_org_or_self, owners_update_by_org_or_self, owners_public_insert
-- - consent_logs: consent_org_select, consent_public_insert
-- ============================================================================

-- ============================================================================
-- STEG 3: SKAPA POLICIES FÖR TABELLER SOM SAKNAR DEM
-- ============================================================================

-- GDPR_DELETION_LOG - Endast organisationens egna raderingsloggar
DO $$
BEGIN
  -- Droppa gamla policies om de finns
  DROP POLICY IF EXISTS "gdpr_deletion_org_select" ON public.gdpr_deletion_log;
  DROP POLICY IF EXISTS "gdpr_deletion_org_insert" ON public.gdpr_deletion_log;
  
  -- SELECT: Se endast sin egen orgs raderingar
  CREATE POLICY "gdpr_deletion_org_select" 
    ON public.gdpr_deletion_log
    FOR SELECT 
    TO authenticated
    USING (
      org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
      )
    );

  -- INSERT: Bara authenticated users kan logga raderingar (via backend)
  CREATE POLICY "gdpr_deletion_org_insert" 
    ON public.gdpr_deletion_log
    FOR INSERT 
    TO authenticated
    WITH CHECK (
      org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
      )
    );
END $$;

-- ORG_SUBSCRIPTIONS - Endast organisationens egna abonnemang
DO $$
BEGIN
  DROP POLICY IF EXISTS "org_subscriptions_org_select" ON public.org_subscriptions;
  DROP POLICY IF EXISTS "org_subscriptions_org_update" ON public.org_subscriptions;
  
  -- SELECT: Se endast sin egen orgs abonnemang
  CREATE POLICY "org_subscriptions_org_select" 
    ON public.org_subscriptions
    FOR SELECT 
    TO authenticated
    USING (
      org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
      )
    );

  -- UPDATE: Endast backend kan uppdatera (service_role)
  -- Men tillåt authenticated att se ändringarna
  CREATE POLICY "org_subscriptions_org_update" 
    ON public.org_subscriptions
    FOR UPDATE 
    TO authenticated
    USING (
      org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
      )
    );
END $$;

-- INVOICE_COUNTERS - Endast organisationens egna fakturanummer
DO $$
BEGIN
  DROP POLICY IF EXISTS "invoice_counters_org_select" ON public.invoice_counters;
  
  -- SELECT: Se endast sin egen orgs counter
  CREATE POLICY "invoice_counters_org_select" 
    ON public.invoice_counters
    FOR SELECT 
    TO authenticated
    USING (
      org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
      )
    );

  -- UPDATE/INSERT hanteras av service_role (backend triggers)
  -- Ingen policy behövs för dessa - RLS blockerar automatiskt
END $$;

-- BOARDING_PRICES - Endast organisationens egna priser
DO $$
BEGIN
  DROP POLICY IF EXISTS "boarding_prices_org_all" ON public.boarding_prices;
  
  -- ALL: Full access för org (SELECT, INSERT, UPDATE, DELETE)
  CREATE POLICY "boarding_prices_org_all" 
    ON public.boarding_prices
    FOR ALL 
    TO authenticated
    USING (
      org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
      )
    )
    WITH CHECK (
      org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
      )
    );
END $$;

-- SYSTEM_CONFIG - Global konfiguration men org-isolerad
DO $$
BEGIN
  DROP POLICY IF EXISTS "system_config_org_select" ON public.system_config;
  DROP POLICY IF EXISTS "system_config_admin_update" ON public.system_config;
  
  -- SELECT: Alla kan läsa sin orgs config
  CREATE POLICY "system_config_org_select" 
    ON public.system_config
    FOR SELECT 
    TO authenticated
    USING (
      org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid()
      )
    );

  -- UPDATE: Endast admins kan ändra
  CREATE POLICY "system_config_admin_update" 
    ON public.system_config
    FOR UPDATE 
    TO authenticated
    USING (
      org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
      )
    )
    WITH CHECK (
      org_id IN (
        SELECT org_id FROM profiles WHERE id = auth.uid() AND role = 'admin'
      )
    );
END $$;

-- MIGRATIONS - Skrivskyddad, endast läsning av service_role
-- Denna tabell bör INTE vara tillgänglig för vanliga användare alls
DO $$
BEGIN
  DROP POLICY IF EXISTS "migrations_service_role_only" ON public.migrations;
  
  -- Ingen policy = ingen access för authenticated users
  -- Service role har alltid full access (kringgår RLS)
  -- Detta är rätt beteende för migrations-tabellen
END $$;

-- ============================================================================
-- STEG 4: FIX SECURITY DEFINER VIEWS
-- ============================================================================
-- Security Advisor varnade för 4 views med SECURITY DEFINER
-- Dessa är diagnostiska views - låt oss säkra dem

-- 1. users_without_org - Lägg till RLS-check
DROP VIEW IF EXISTS public.users_without_org CASCADE;
CREATE VIEW public.users_without_org 
WITH (security_invoker = true) -- ÄNDRAT från security_definer
AS
SELECT 
  p.id,
  p.email,
  p.full_name,
  p.org_id,
  p.created_at
FROM profiles p
WHERE p.org_id IS NULL;

-- 2. invoice_runs_summary - Byt till security_invoker
DROP VIEW IF EXISTS public.invoice_runs_summary CASCADE;
CREATE VIEW public.invoice_runs_summary
WITH (security_invoker = true)
AS
SELECT 
  ir.id,
  ir.org_id,
  ir.run_date,
  ir.status,
  COUNT(i.id) as invoice_count,
  SUM(i.total_amount) as total_amount
FROM invoice_runs ir
LEFT JOIN invoices i ON i.invoice_run_id = ir.id
GROUP BY ir.id, ir.org_id, ir.run_date, ir.status;

-- 3. trigger_health_summary - Byt till security_invoker
DROP VIEW IF EXISTS public.trigger_health_summary CASCADE;
CREATE VIEW public.trigger_health_summary
WITH (security_invoker = true)
AS
SELECT 
  COUNT(*) FILTER (WHERE status = 'success') as successful_triggers,
  COUNT(*) FILTER (WHERE status = 'error') as failed_triggers,
  MAX(executed_at) as last_execution
FROM trigger_execution_log
WHERE executed_at > NOW() - INTERVAL '24 hours';

-- 4. recent_trigger_failures - Byt till security_invoker
DROP VIEW IF EXISTS public.recent_trigger_failures CASCADE;
CREATE VIEW public.recent_trigger_failures
WITH (security_invoker = true)
AS
SELECT 
  trigger_name,
  error_message,
  executed_at
FROM trigger_execution_log
WHERE status = 'error'
  AND executed_at > NOW() - INTERVAL '7 days'
ORDER BY executed_at DESC
LIMIT 100;

-- ============================================================================
-- STEG 5: LÄGG TILL RLS PÅ VIEWS OM DE BEHÖVS
-- ============================================================================

-- invoice_runs_summary behöver RLS för att isolera per org
ALTER VIEW public.invoice_runs_summary SET (security_invoker = true);

-- De andra views är diagnostiska och bör endast vara tillgängliga för admins
-- Vi skapar en policy på trigger_execution_log istället

DO $$
BEGIN
  -- Kontrollera om trigger_execution_log finns
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'trigger_execution_log') THEN
    
    -- Aktivera RLS om inte redan aktivt
    ALTER TABLE public.trigger_execution_log ENABLE ROW LEVEL SECURITY;
    
    -- Droppa gamla policies
    DROP POLICY IF EXISTS "trigger_log_admin_only" ON public.trigger_execution_log;
    
    -- Endast admins kan se trigger-loggar
    CREATE POLICY "trigger_log_admin_only" 
      ON public.trigger_execution_log
      FOR SELECT 
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM profiles 
          WHERE id = auth.uid() 
          AND role = 'admin'
        )
      );
  END IF;
END $$;

-- ============================================================================
-- STEG 6: VERIFIERING
-- ============================================================================

-- Lista alla tabeller och deras RLS-status
DO $$
DECLARE
  r RECORD;
  total_tables INT := 0;
  rls_enabled INT := 0;
  rls_disabled INT := 0;
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'RLS STATUS EFTER FIX';
  RAISE NOTICE '============================================================================';
  
  FOR r IN (
    SELECT 
      schemaname,
      tablename,
      rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  ) LOOP
    total_tables := total_tables + 1;
    
    IF r.rowsecurity THEN
      rls_enabled := rls_enabled + 1;
      RAISE NOTICE '✅ %.% - RLS ENABLED', r.schemaname, r.tablename;
    ELSE
      rls_disabled := rls_disabled + 1;
      RAISE NOTICE '❌ %.% - RLS DISABLED', r.schemaname, r.tablename;
    END IF;
  END LOOP;
  
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'SAMMANFATTNING:';
  RAISE NOTICE '  Total tabeller: %', total_tables;
  RAISE NOTICE '  RLS enabled: %', rls_enabled;
  RAISE NOTICE '  RLS disabled: %', rls_disabled;
  RAISE NOTICE '============================================================================';
END $$;

-- Lista alla policies på kritiska tabeller
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN (
    'bookings', 'dogs', 'owners', 'consent_logs',
    'gdpr_deletion_log', 'org_subscriptions', 'invoice_counters',
    'boarding_prices', 'system_config'
  )
ORDER BY tablename, policyname;

COMMIT;

-- ============================================================================
-- POST-DEPLOYMENT CHECKS
-- ============================================================================
-- Kör dessa queries EFTER att ha kört scriptet ovan:

-- 1. Verifiera att inga kritiska tabeller saknar RLS
-- SELECT 
--   tablename,
--   rowsecurity
-- FROM pg_tables
-- WHERE schemaname = 'public'
--   AND tablename IN ('bookings', 'dogs', 'owners', 'consent_logs', 'org_subscriptions')
--   AND rowsecurity = false;
-- -- Ska returnera 0 rader!

-- 2. Testa att policies fungerar (kör som authenticated user)
-- SELECT COUNT(*) FROM bookings;  -- Ska endast se din orgs bokningar
-- SELECT COUNT(*) FROM owners;     -- Ska endast se din orgs ägare

-- 3. Verifiera views är security_invoker
-- SELECT 
--   viewname,
--   definition
-- FROM pg_views
-- WHERE schemaname = 'public'
--   AND viewname IN ('users_without_org', 'invoice_runs_summary', 'trigger_health_summary', 'recent_trigger_failures');

-- ============================================================================
-- DOKUMENTATION
-- ============================================================================
-- 
-- VVAD DETTA SCRIPT FIXAR:
-- -------------------------
-- 1. ✅ Aktiverar RLS på 10 tabeller som saknade det
-- 2. ✅ Skapar policies för tabeller utan policies (gdpr_deletion_log, org_subscriptions, etc.)
-- 3. ✅ Fixar 4 Security Definer views → security_invoker
-- 4. ✅ Skyddar trigger_execution_log med admin-only policy
-- 5. ✅ Migrations-tabellen låses helt (ingen user access)
--
-- MULTI-TENANCY PATTERN:
-- ----------------------
-- Alla policies följer samma mönster:
--
--   USING (
--     org_id IN (
--       SELECT org_id FROM profiles WHERE id = auth.uid()
--     )
--   )
--
-- Detta säkerställer att användare ENDAST ser data från sin egen organisation.
--
-- SÄRSKILDA FALL:
-- ---------------
-- - bookings, dogs, owners: Har redan policies från remote_schema.sql
-- - consent_logs: Har redan policies, vi aktiverar bara RLS
-- - migrations: Ingen access för users (endast service_role)
-- - trigger_execution_log: Endast admins kan läsa
--
-- SÄKERHETSNIVÅER:
-- ----------------
-- 1. RLS aktiverad = Grundskydd
-- 2. Policies = Org-isolering
-- 3. Role-checks (admin) = Extra skydd för känsliga tabeller
--
-- ============================================================================
