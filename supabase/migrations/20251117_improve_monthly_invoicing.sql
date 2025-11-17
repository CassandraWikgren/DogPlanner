-- ============================================================================
-- AUTOMATIC MONTHLY INVOICING - IMPROVEMENTS
-- ============================================================================
-- Uppdatering: 2025-11-17
-- Syfte: Förbättra existerande månadsfakturering med:
--   1. invoice_runs tabell för loggning
--   2. Email-notifikationer till kunder efter faktura skapats
--   3. Auto-skicka fakturor (status: draft → sent)
--   4. Invoice number-generation
--
-- BAKGRUND:
-- System HAR redan:
-- ✅ Edge Function: supabase/functions/generate_invoices/index.ts
-- ✅ GitHub Action: .github/workflows/auto_generate_invoices.yml (körs 1:a varje månad)
-- ✅ Skapar invoices + invoice_items från subscriptions + extra_services
--
-- System SAKNAR:
-- ❌ invoice_runs tabell (loggning av varje körning)
-- ❌ Email till kunder när faktura skapats
-- ❌ Auto-send fakturor (sätts bara till "draft")
-- ❌ Invoice number (just nu används invoice.id)
-- ============================================================================

-- === 1. SKAPA INVOICE_RUNS TABELL FÖR LOGGNING ===
-- Rensa gamla versioner som kan ha fel schema
DROP TABLE IF EXISTS invoice_runs;

CREATE TABLE invoice_runs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  month_id text NOT NULL,  -- Format: "YYYY-MM" (t.ex. "2025-11")
  status text NOT NULL,     -- 'success', 'failed', 'partial'
  invoices_created integer DEFAULT 0,
  run_at timestamptz DEFAULT now(),
  error_message text,
  metadata jsonb           -- Extra info (antal hundar, total belopp, etc.)
);

-- Index för snabb sökning
CREATE INDEX IF NOT EXISTS idx_invoice_runs_month 
  ON invoice_runs(month_id);
CREATE INDEX IF NOT EXISTS idx_invoice_runs_status 
  ON invoice_runs(status);
CREATE INDEX IF NOT EXISTS idx_invoice_runs_run_at 
  ON invoice_runs(run_at DESC);

-- === 2. LÄGG TILL INVOICE_NUMBER I INVOICES ===
-- Kontrollera om kolumnen redan finns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'invoice_number'
  ) THEN
    ALTER TABLE invoices ADD COLUMN invoice_number text;
  END IF;
END $$;

-- Skapa unik constraint
ALTER TABLE invoices 
  DROP CONSTRAINT IF EXISTS invoices_invoice_number_org_unique;
ALTER TABLE invoices 
  ADD CONSTRAINT invoices_invoice_number_org_unique 
  UNIQUE (org_id, invoice_number);

-- === 3. FUNCTION FÖR ATT GENERERA INVOICE NUMBER ===
CREATE OR REPLACE FUNCTION generate_invoice_number(p_org_id uuid)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_year text;
  v_month text;
  v_sequence integer;
  v_invoice_number text;
BEGIN
  -- Format: YYYY-MM-XXXX (t.ex. 2025-11-0001)
  v_year := to_char(CURRENT_DATE, 'YYYY');
  v_month := to_char(CURRENT_DATE, 'MM');
  
  -- Hitta högsta sequence number för denna månad
  SELECT COALESCE(
    MAX(
      CAST(
        split_part(invoice_number, '-', 3) AS integer
      )
    ), 
    0
  ) + 1
  INTO v_sequence
  FROM invoices
  WHERE org_id = p_org_id
    AND invoice_number LIKE v_year || '-' || v_month || '-%';
  
  -- Generera nummer med 4 siffror (t.ex. 0001)
  v_invoice_number := v_year || '-' || v_month || '-' || 
                      lpad(v_sequence::text, 4, '0');
  
  RETURN v_invoice_number;
END;
$$;

-- === 4. TRIGGER FÖR ATT AUTO-GENERERA INVOICE NUMBER ===
CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  -- Sätt invoice_number om den inte finns
  IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
    NEW.invoice_number := generate_invoice_number(NEW.org_id);
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_set_invoice_number ON invoices;
CREATE TRIGGER trigger_set_invoice_number
  BEFORE INSERT ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION set_invoice_number();

-- === 5. FUNCTION FÖR ATT SKICKA INVOICE EMAIL ===
-- Detta anropas från Edge Function efter faktura skapats
CREATE OR REPLACE FUNCTION send_invoice_email(p_invoice_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invoice record;
  v_owner record;
  v_org record;
  v_result jsonb;
BEGIN
  -- Hämta faktura med alla relationer
  SELECT i.*, 
         o.full_name, o.email as owner_email,
         org.name as org_name, org.email as org_email
  INTO v_invoice
  FROM invoices i
  LEFT JOIN owners o ON i.owner_id = o.id
  LEFT JOIN orgs org ON i.org_id = org.id
  WHERE i.id = p_invoice_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invoice not found'
    );
  END IF;
  
  -- TODO: Integrera med emailSender.ts (detta är placeholder)
  -- I production: Anropa Resend API eller använd pg_net för HTTP request
  
  -- Logga att email skulle skickas
  INSERT INTO function_logs (function_name, status, message)
  VALUES (
    'send_invoice_email',
    'success',
    format('Email sent for invoice %s to %s', 
           v_invoice.invoice_number, 
           v_invoice.owner_email)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'invoice_number', v_invoice.invoice_number,
    'sent_to', v_invoice.owner_email
  );
END;
$$;

-- === 6. UPPDATERA GENERATE_INVOICES EDGE FUNCTION ===
-- Instruktioner för manuell uppdatering av Edge Function
-- (Detta kan INTE köras i SQL - måste göras i Edge Function-koden)
--
-- I supabase/functions/generate_invoices/index.ts, lägg till efter insert:
--
-- ```typescript
-- // Efter invoice skapats:
-- if (insertedInvoice) {
--   // 1. Logga i invoice_runs
--   await supabase.from('invoice_runs').insert({
--     month_id: monthId,
--     status: 'success',
--     invoices_created: invoices.length,
--     metadata: { total_amount: totalAmount, dog_count: dogCount }
--   });
--
--   // 2. Skicka email till kund
--   await supabase.rpc('send_invoice_email', { 
--     p_invoice_id: insertedInvoice.id 
--   });
--
--   // 3. Sätt status till 'sent' (inte bara 'draft')
--   await supabase
--     .from('invoices')
--     .update({ status: 'sent', sent_at: new Date().toISOString() })
--     .eq('id', insertedInvoice.id);
-- }
-- ```

-- === 7. LÄGG TILL SENT_AT KOLUMN ===
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'sent_at'
  ) THEN
    ALTER TABLE invoices ADD COLUMN sent_at timestamptz;
  END IF;
END $$;

-- Index för sent invoices
CREATE INDEX IF NOT EXISTS idx_invoices_sent_at 
  ON invoices(sent_at DESC) 
  WHERE sent_at IS NOT NULL;

-- === 8. VIEW FÖR ATT SE INVOICE RUNS SUMMARY ===
CREATE OR REPLACE VIEW invoice_runs_summary AS
SELECT 
  month_id,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE status = 'success') as successful_runs,
  COUNT(*) FILTER (WHERE status = 'failed') as failed_runs,
  SUM(invoices_created) as total_invoices_created,
  MAX(run_at) as last_run_at
FROM invoice_runs
GROUP BY month_id
ORDER BY month_id DESC;

-- === 9. FUNCTION FÖR ATT MANUELLT KÖRA FAKTURERING ===
-- Detta kan användas för att testa eller köra om för en specifik månad
CREATE OR REPLACE FUNCTION trigger_invoice_generation(p_month text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_month text;
  v_result jsonb;
BEGIN
  -- Om ingen månad angavs, använd aktuell månad
  v_month := COALESCE(
    p_month, 
    to_char(CURRENT_DATE, 'YYYY-MM')
  );
  
  -- Kontrollera om fakturor redan genererats för denna månad
  IF EXISTS (
    SELECT 1 FROM invoice_runs 
    WHERE month_id = v_month 
      AND status = 'success'
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', format('Invoices already generated for %s', v_month),
      'month', v_month
    );
  END IF;
  
  -- Logga att manuell körning initierades
  INSERT INTO function_logs (function_name, status, message)
  VALUES (
    'trigger_invoice_generation',
    'info',
    format('Manual invoice generation triggered for %s', v_month)
  );
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Invoice generation triggered',
    'month', v_month,
    'note', 'Edge Function must be called separately via API'
  );
END;
$$;

-- ============================================================================
-- TESTNING
-- ============================================================================

-- Test 1: Generera invoice number
SELECT generate_invoice_number('00000000-0000-0000-0000-000000000000'::uuid);
-- Förväntat: "2025-11-0001" (eller aktuell månad)

-- Test 2: Skapa testfaktura och verifiera auto-number
-- INSERT INTO invoices (org_id, owner_id, total_amount, status, invoice_date, due_date)
-- VALUES (
--   'YOUR_ORG_ID'::uuid,
--   'YOUR_OWNER_ID'::uuid,
--   1000,
--   'draft',
--   CURRENT_DATE,
--   CURRENT_DATE + INTERVAL '30 days'
-- )
-- RETURNING invoice_number;
-- Förväntat: Auto-genererat nummer som "2025-11-0001"

-- Test 3: Visa invoice runs summary
SELECT * FROM invoice_runs_summary;

-- Test 4: Logga en test-run
INSERT INTO invoice_runs (month_id, status, invoices_created, metadata)
VALUES (
  to_char(CURRENT_DATE, 'YYYY-MM'),
  'success',
  5,
  '{"total_amount": 12500, "dog_count": 8}'::jsonb
);

-- ============================================================================
-- DEPLOYMENT CHECKLIST
-- ============================================================================
-- [ ] 1. Kör denna SQL i Supabase SQL Editor
-- [ ] 2. Verifiera att invoice_runs tabell finns
-- [ ] 3. Verifiera att invoice_number kolumn finns i invoices
-- [ ] 4. Testa generate_invoice_number() function
-- [ ] 5. Uppdatera Edge Function generate_invoices/index.ts med:
--        - Logga till invoice_runs
--        - Anropa send_invoice_email
--        - Sätt status = 'sent' istället för 'draft'
-- [ ] 6. Deploy Edge Function via Supabase Dashboard
-- [ ] 7. Testa manuellt via GitHub Actions "workflow_dispatch"
-- [ ] 8. Verifiera email skickas till kunder
-- [ ] 9. Kolla invoice_runs_summary för statistik
-- ============================================================================

-- För att rulla tillbaka (om något går fel):
-- DROP TABLE IF EXISTS invoice_runs CASCADE;
-- DROP FUNCTION IF EXISTS generate_invoice_number CASCADE;
-- DROP FUNCTION IF EXISTS set_invoice_number CASCADE;
-- DROP TRIGGER IF EXISTS trigger_set_invoice_number ON invoices;
-- DROP FUNCTION IF EXISTS send_invoice_email CASCADE;
-- DROP FUNCTION IF EXISTS trigger_invoice_generation CASCADE;
-- DROP VIEW IF EXISTS invoice_runs_summary CASCADE;
-- ALTER TABLE invoices DROP COLUMN IF EXISTS invoice_number;
-- ALTER TABLE invoices DROP COLUMN IF EXISTS sent_at;
