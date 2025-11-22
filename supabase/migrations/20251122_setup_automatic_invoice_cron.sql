-- ================================================================
-- MIGRATION: Automatic Monthly Invoice Generation via pg_cron
-- Skapad: 2025-11-22
-- Syfte: Ersätt GitHub Actions med pålitlig Supabase pg_cron
-- ================================================================

-- Aktivera pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- ================================================================
-- 1. SCHEDULE MONTHLY INVOICE GENERATION
-- ================================================================
-- Körs kl 08:00 UTC den 1:a varje månad
-- Fakturerar FÖREGÅENDE månad (som är korrekt enligt affärslogik)

SELECT cron.schedule(
  'monthly-invoice-generation',
  '0 8 1 * *', -- Cron: Minute Hour Day Month DayOfWeek
  $$
    SELECT net.http_post(
      url := 'https://fhdkkkujnhteetllxypg.supabase.co/functions/v1/generate_invoices',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings')::jsonb->>'service_role_key'
      ),
      body := jsonb_build_object(
        'month', to_char(CURRENT_DATE - interval '1 month', 'YYYY-MM')
      )
    );
  $$
);

-- ================================================================
-- 2. LOGGING FUNCTION
-- ================================================================
-- Loggar varje körning av cron job

CREATE OR REPLACE FUNCTION log_invoice_cron_run()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO function_logs (function_name, status, message)
  VALUES (
    'monthly-invoice-cron',
    'info',
    'Cron job triggered at ' || NOW()::text
  );
END;
$$;

-- ================================================================
-- 3. VERIFY CRON SCHEDULE
-- ================================================================
-- Kör detta för att se att cron är schemalagd:
-- SELECT * FROM cron.job;

-- ================================================================
-- 4. MANUAL TESTING
-- ================================================================
-- För att testa manuellt (utan att vänta till 1:a):
-- SELECT cron.unschedule('monthly-invoice-generation'); -- Ta bort schemat
-- Kör sedan Edge Function manuellt via Supabase dashboard

-- ================================================================
-- 5. ROLLBACK (om något går fel)
-- ================================================================
-- SELECT cron.unschedule('monthly-invoice-generation');
-- DROP FUNCTION IF EXISTS log_invoice_cron_run();

-- ================================================================
-- KOMMENTARER
-- ================================================================

COMMENT ON EXTENSION pg_cron IS 'Supabase native cron scheduler för automatiska jobb';

-- ================================================================
-- SÄKERHET & BEST PRACTICES
-- ================================================================

-- 1. Service Role Key måste finnas i app.settings (eller Supabase Vault)
-- 2. Edge Function måste vara deployed och tillgänglig
-- 3. invoice_runs tabell loggar alla körningar (se generate_invoices/index.ts)
-- 4. Vid fel: Kontrollera SELECT * FROM cron.job_run_details ORDER BY start_time DESC;

-- ================================================================
-- NÄSTA STEG EFTER DEPLOYMENT
-- ================================================================

-- 1. Verifiera att cron är schemalagd:
--    SELECT * FROM cron.job;
--
-- 2. Kör manuellt första gången för att testa:
--    Supabase Dashboard → Edge Functions → generate_invoices → Invoke
--
-- 3. Kontrollera logs:
--    SELECT * FROM invoice_runs ORDER BY run_at DESC LIMIT 5;
--    SELECT * FROM function_logs WHERE function_name LIKE '%invoice%' ORDER BY created_at DESC LIMIT 10;
--
-- 4. Efter första lyckade körning: Ta bort GitHub Actions workflow
--    (men behåll filen som backup med kommentar att den är deprecated)

-- ================================================================
-- DEPLOYMENT NOTES
-- ================================================================

-- ⚠️ VIKTIGT: 
-- Denna migration kräver att Supabase projektet har pg_cron aktiverat.
-- Om pg_cron inte är tillgängligt, kontakta Supabase support.
--
-- Alternativ: Använd Supabase Scheduled Functions (beta):
-- https://supabase.com/docs/guides/functions/schedule-functions
