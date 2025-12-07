-- ============================================================
-- AKTIVERA RLS OCH REALTIME FÖR ALLA KRITISKA TABELLER
-- ============================================================
-- Detta script aktiverar:
-- 1. Row Level Security (RLS) för datasäkerhet
-- 2. Realtime för live-uppdateringar i appen
--
-- KÖR I: Supabase SQL Editor
-- ============================================================

BEGIN;

-- ============================================================
-- KRITISKA HUVUDTABELLER
-- ============================================================

-- DOGS - Hundregister
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE dogs;

-- OWNERS - Ägare/kunder
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE owners;

-- BOOKINGS - Bokningar (pensionat + dagis)
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE bookings;

-- INTEREST_APPLICATIONS - Intresseanmälningar
-- (Har redan RLS, lägger till Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE interest_applications;

-- ============================================================
-- DAGLIG VERKSAMHET
-- ============================================================

-- DAYCARE_SERVICE_COMPLETIONS - Daglig närvaro/tjänster
ALTER TABLE daycare_service_completions ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE daycare_service_completions;

-- DOG_JOURNAL - Journalanteckningar
ALTER PUBLICATION supabase_realtime ADD TABLE dog_journal;

-- CONSENT_LOGS - GDPR-samtycken
ALTER TABLE consent_logs ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE consent_logs;

-- ============================================================
-- FRISÖR/GROOMING
-- ============================================================

-- GROOMING_BOOKINGS - Frisörbokningar
ALTER TABLE grooming_bookings ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE grooming_bookings;

-- GROOMING_JOURNAL - Frisörjournal
ALTER TABLE grooming_journal ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE grooming_journal;

-- ============================================================
-- FAKTURERING
-- ============================================================

-- INVOICE_RUNS - Faktureringskörningar
ALTER TABLE invoice_runs ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE invoice_runs;

-- INVOICE_RUNS_SUMMARY - Sammanfattningar
ALTER TABLE invoice_runs_summary ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE invoice_runs_summary;

-- INVOICES - Fakturor
-- (Har redan RLS, lägger till Realtime)
ALTER PUBLICATION supabase_realtime ADD TABLE invoices;

-- ============================================================
-- SYSTEM OCH KONFIGURATION
-- ============================================================

-- MIGRATIONS - Databasmigrationer
ALTER TABLE migrations ENABLE ROW LEVEL SECURITY;

-- ORG_SUBSCRIPTIONS - Organisationsabonnemang
ALTER TABLE org_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE org_subscriptions;

-- SUBSCRIPTION_TYPES - Abonnemangstyper
ALTER TABLE subscription_types ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE subscription_types;

-- SYSTEM_CONFIG - Systemkonfiguration
ALTER TABLE system_config ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE system_config;

COMMIT;

-- ============================================================
-- VERIFIERA ÄNDRINGAR
-- ============================================================

-- Kolla vilka tabeller som har RLS
SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity = true THEN '✅ RLS Enabled'
    ELSE '❌ RLS Disabled'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'dogs', 'owners', 'bookings', 'interest_applications',
    'daycare_service_completions', 'dog_journal', 'consent_logs',
    'grooming_bookings', 'grooming_journal',
    'invoice_runs', 'invoice_runs_summary', 'invoices',
    'migrations', 'org_subscriptions', 'subscription_types', 'system_config'
  )
ORDER BY tablename;

-- Kolla vilka tabeller som har Realtime
SELECT 
  tablename,
  '📡 Realtime Enabled' as realtime_status
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND schemaname = 'public'
  AND tablename IN (
    'dogs', 'owners', 'bookings', 'interest_applications',
    'daycare_service_completions', 'dog_journal', 'consent_logs',
    'grooming_bookings', 'grooming_journal',
    'invoice_runs', 'invoice_runs_summary', 'invoices',
    'org_subscriptions', 'subscription_types', 'system_config'
  )
ORDER BY tablename;

-- ============================================================
-- VIKTIGT: RLS-POLICIES
-- ============================================================
-- OBS: Detta script aktiverar RLS men skapar INTE policies!
-- 
-- Befintliga policies finns redan i schema.sql för:
-- - dogs, owners, interest_applications, invoices, dog_journal
--
-- För nya tabeller (daycare_service_completions, grooming_bookings, etc.)
-- behöver du skapa policies separat om de ska vara restriktiva.
--
-- Exempel policy-mall:
-- CREATE POLICY "allow_org_access" ON table_name
--   FOR ALL TO authenticated
--   USING (org_id = (SELECT org_id FROM profiles WHERE id = auth.uid()));
--
-- ============================================================
