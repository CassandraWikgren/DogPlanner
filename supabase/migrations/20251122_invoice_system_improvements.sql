-- ================================================================
-- FAKTURAUNDERLAG FÖR BOKFÖRINGSSYSTEM
-- Skapad: 2025-11-22
-- Syfte: Löpande fakturanummer, OCR, påminnelser, exportkompatibilitet
-- ================================================================

-- ================================================================
-- 1. INVOICE_COUNTERS - Löpande fakturanumrering per organisation
-- ================================================================

CREATE TABLE IF NOT EXISTS invoice_counters (
  org_id UUID NOT NULL REFERENCES orgs(id) ON DELETE CASCADE,
  current_year INT NOT NULL,
  counter INT NOT NULL DEFAULT 0,
  prefix TEXT DEFAULT 'INV',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (org_id, current_year)
);

-- Index för snabbare lookups
CREATE INDEX IF NOT EXISTS idx_invoice_counters_org_year 
ON invoice_counters(org_id, current_year);

COMMENT ON TABLE invoice_counters IS 'Räknare för löpande fakturanummer per organisation och år';
COMMENT ON COLUMN invoice_counters.prefix IS 'Fakturanummerprefix (t.ex. INV, DP, HUND)';
COMMENT ON COLUMN invoice_counters.counter IS 'Nästa tillgängliga löpnummer för året';

-- ================================================================
-- 2. FUNKTION: Generera nästa fakturanummer
-- ================================================================

CREATE OR REPLACE FUNCTION generate_invoice_number(p_org_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_year INT;
  v_counter INT;
  v_prefix TEXT;
  v_invoice_number TEXT;
BEGIN
  v_current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Hämta eller skapa räknare för detta år
  INSERT INTO invoice_counters (org_id, current_year, counter, prefix)
  VALUES (p_org_id, v_current_year, 1, 'INV')
  ON CONFLICT (org_id, current_year)
  DO UPDATE SET 
    counter = invoice_counters.counter + 1,
    updated_at = NOW()
  RETURNING counter, prefix INTO v_counter, v_prefix;
  
  -- Formatera: PREFIX-YYYY-NNNNN (ex: INV-2025-00001)
  v_invoice_number := v_prefix || '-' || v_current_year || '-' || LPAD(v_counter::TEXT, 5, '0');
  
  RETURN v_invoice_number;
END;
$$;

COMMENT ON FUNCTION generate_invoice_number IS 'Genererar nästa löpande fakturanummer för en organisation';

-- ================================================================
-- 3. TRIGGER: Auto-generera fakturanummer vid INSERT
-- ================================================================

CREATE OR REPLACE FUNCTION set_invoice_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Generera endast om invoice_number är NULL
  IF NEW.invoice_number IS NULL THEN
    NEW.invoice_number := generate_invoice_number(NEW.org_id);
  END IF;
  RETURN NEW;
END;
$$;

-- Ta bort gammal trigger om den finns
DROP TRIGGER IF EXISTS trg_set_invoice_number ON invoices;

-- Skapa ny trigger
CREATE TRIGGER trg_set_invoice_number
BEFORE INSERT ON invoices
FOR EACH ROW
EXECUTE FUNCTION set_invoice_number();

COMMENT ON FUNCTION set_invoice_number IS 'Trigger-funktion som auto-genererar fakturanummer';

-- ================================================================
-- 4. UTÖKA ORGS - Betalningsinformation
-- ================================================================

-- Lägg till betalningsinformation i orgs-tabellen
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS bankgiro TEXT;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS plusgiro TEXT;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS swish_number TEXT;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS bank_name TEXT DEFAULT 'SEB';
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS iban TEXT;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS bic_swift TEXT;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS payment_terms_days INT DEFAULT 14;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS late_fee_amount NUMERIC(10,2) DEFAULT 60.00;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS interest_rate NUMERIC(5,2) DEFAULT 8.00;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS invoice_prefix TEXT DEFAULT 'INV';

COMMENT ON COLUMN orgs.bankgiro IS 'Bankgironummer för betalningar';
COMMENT ON COLUMN orgs.plusgiro IS 'Plusgironummer för betalningar';
COMMENT ON COLUMN orgs.swish_number IS 'Swish-nummer för betalningar';
COMMENT ON COLUMN orgs.bank_name IS 'Bankens namn';
COMMENT ON COLUMN orgs.iban IS 'IBAN för internationella betalningar';
COMMENT ON COLUMN orgs.bic_swift IS 'BIC/SWIFT-kod';
COMMENT ON COLUMN orgs.payment_terms_days IS 'Antal dagar betalningsvillkor (default: 14)';
COMMENT ON COLUMN orgs.late_fee_amount IS 'Påminnelseavgift i SEK (default: 60 kr enligt inkassolagen)';
COMMENT ON COLUMN orgs.interest_rate IS 'Dröjsmålsränta i procent per år (default: 8%)';
COMMENT ON COLUMN orgs.invoice_prefix IS 'Prefix för fakturanummer (default: INV)';

-- ================================================================
-- 5. UTÖKA INVOICES - Påminnelser och OCR
-- ================================================================

-- Lägg till påminnelsekolumner
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_1_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_2_date DATE;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_1_fee NUMERIC(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS reminder_2_fee NUMERIC(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS collection_fee NUMERIC(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS late_interest NUMERIC(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS ocr_number TEXT;
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS payment_reference TEXT;

COMMENT ON COLUMN invoices.paid_at IS 'Tidpunkt när fakturan betalades (sätts manuellt av företaget)';
COMMENT ON COLUMN invoices.payment_method IS 'Betalningsmetod: bankgiro, swish, kort, etc';
COMMENT ON COLUMN invoices.reminder_1_date IS 'Datum då första påminnelsen skickades';
COMMENT ON COLUMN invoices.reminder_2_date IS 'Datum då andra påminnelsen skickades';
COMMENT ON COLUMN invoices.reminder_1_fee IS 'Avgift för första påminnelsen (ofta 0 kr)';
COMMENT ON COLUMN invoices.reminder_2_fee IS 'Avgift för andra påminnelsen (ofta 60 kr)';
COMMENT ON COLUMN invoices.collection_fee IS 'Inkassoavgift (ofta 180 kr)';
COMMENT ON COLUMN invoices.late_interest IS 'Beräknad dröjsmålsränta';
COMMENT ON COLUMN invoices.ocr_number IS 'OCR-nummer för automatisk betalningskoppling';
COMMENT ON COLUMN invoices.payment_reference IS 'Betalningsreferens (alternativ till OCR)';

-- ================================================================
-- 6. UPPDATERA STATUS-CONSTRAINT
-- ================================================================

-- Ta bort gammal constraint
ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_status_check;

-- Lägg till ny constraint med fler statusar
ALTER TABLE invoices
  ADD CONSTRAINT invoices_status_check 
  CHECK (status IN (
    'draft',          -- Utkast
    'sent',           -- Skickad
    'paid',           -- Betald
    'cancelled',      -- Makulerad
    'overdue',        -- Förfallen (ej påmind)
    'reminder_1',     -- Första påminnelsen skickad
    'reminder_2',     -- Andra påminnelsen skickad
    'collection'      -- Skickad till inkasso
  ));

COMMENT ON CONSTRAINT invoices_status_check ON invoices IS 
  'Giltiga fakturastatus: draft, sent, paid, cancelled, overdue, reminder_1, reminder_2, collection';

-- ================================================================
-- 7. INDEX FÖR SNABBARE QUERIES
-- ================================================================

-- Index för att hitta förfallna fakturor snabbt
CREATE INDEX IF NOT EXISTS idx_invoices_overdue 
ON invoices(due_date, status) 
WHERE status IN ('sent', 'overdue', 'reminder_1', 'reminder_2') 
  AND paid_at IS NULL;

-- Index för OCR-lookup
CREATE INDEX IF NOT EXISTS idx_invoices_ocr 
ON invoices(ocr_number) 
WHERE ocr_number IS NOT NULL;

-- Index för betalningsreferens
CREATE INDEX IF NOT EXISTS idx_invoices_payment_ref 
ON invoices(payment_reference) 
WHERE payment_reference IS NOT NULL;

-- ================================================================
-- 8. HJÄLPFUNKTION: Beräkna dröjsmålsränta
-- ================================================================

CREATE OR REPLACE FUNCTION calculate_late_interest(
  p_invoice_id UUID
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_amount NUMERIC;
  v_due_date DATE;
  v_interest_rate NUMERIC;
  v_days_overdue INT;
  v_interest NUMERIC;
BEGIN
  -- Hämta fakturadata
  SELECT 
    i.total_amount,
    i.due_date,
    COALESCE(o.interest_rate, 8.00)
  INTO 
    v_total_amount,
    v_due_date,
    v_interest_rate
  FROM invoices i
  LEFT JOIN orgs o ON o.id = i.org_id
  WHERE i.id = p_invoice_id;
  
  -- Beräkna antal dagar försenad
  v_days_overdue := GREATEST(0, CURRENT_DATE - v_due_date);
  
  -- Beräkna dröjsmålsränta (enkel ränta per dag)
  -- Formel: Belopp × (Ränta / 100) × (Dagar / 365)
  v_interest := v_total_amount * (v_interest_rate / 100) * (v_days_overdue::NUMERIC / 365);
  
  -- Avrunda till 2 decimaler
  RETURN ROUND(v_interest, 2);
END;
$$;

COMMENT ON FUNCTION calculate_late_interest IS 
  'Beräknar dröjsmålsränta för en förfallen faktura baserat på antal dagar och organisationens räntesats';

-- ================================================================
-- 9. HJÄLPFUNKTION: Uppdatera totalsumma med avgifter
-- ================================================================

CREATE OR REPLACE FUNCTION update_invoice_with_fees(
  p_invoice_id UUID,
  p_reminder_level INT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_base_amount NUMERIC;
  v_reminder_fee NUMERIC;
  v_late_interest NUMERIC;
  v_new_total NUMERIC;
BEGIN
  -- Hämta grundbelopp (original total_amount)
  SELECT 
    total_amount - COALESCE(reminder_1_fee, 0) - COALESCE(reminder_2_fee, 0) - COALESCE(late_interest, 0)
  INTO v_base_amount
  FROM invoices
  WHERE id = p_invoice_id;
  
  -- Sätt påminnelseavgift beroende på nivå
  IF p_reminder_level = 1 THEN
    v_reminder_fee := 0;  -- Ofta ingen avgift på första påminnelsen
  ELSIF p_reminder_level = 2 THEN
    v_reminder_fee := 60; -- Lagstadgad påminnelseavgift
  ELSE
    v_reminder_fee := 0;
  END IF;
  
  -- Beräkna dröjsmålsränta
  v_late_interest := calculate_late_interest(p_invoice_id);
  
  -- Uppdatera fakturan
  IF p_reminder_level = 1 THEN
    UPDATE invoices
    SET 
      reminder_1_fee = v_reminder_fee,
      late_interest = v_late_interest,
      total_amount = v_base_amount + v_reminder_fee + v_late_interest,
      updated_at = NOW()
    WHERE id = p_invoice_id;
  ELSIF p_reminder_level = 2 THEN
    UPDATE invoices
    SET 
      reminder_2_fee = v_reminder_fee,
      late_interest = v_late_interest,
      total_amount = v_base_amount + COALESCE(reminder_1_fee, 0) + v_reminder_fee + v_late_interest,
      updated_at = NOW()
    WHERE id = p_invoice_id;
  END IF;
END;
$$;

COMMENT ON FUNCTION update_invoice_with_fees IS 
  'Uppdaterar faktura med påminnelseavgifter och dröjsmålsränta';

-- ================================================================
-- 10. MIGRERA BEFINTLIGA FAKTUROR
-- ================================================================

-- Generera fakturanummer för befintliga fakturor som saknar det
DO $$
DECLARE
  v_invoice RECORD;
BEGIN
  FOR v_invoice IN 
    SELECT id, org_id 
    FROM invoices 
    WHERE invoice_number IS NULL OR invoice_number = ''
    ORDER BY created_at
  LOOP
    UPDATE invoices
    SET invoice_number = generate_invoice_number(v_invoice.org_id)
    WHERE id = v_invoice.id;
  END LOOP;
END;
$$;

-- ================================================================
-- 11. SEED DATA FÖR TESTNING
-- ================================================================

-- Uppdatera testorganisationer med betalningsinformation
UPDATE orgs
SET 
  bankgiro = '123-4567',
  plusgiro = '12 34 56-7',
  swish_number = '123 456 78 90',
  payment_terms_days = 14,
  late_fee_amount = 60.00,
  interest_rate = 8.00,
  invoice_prefix = 'DP'
WHERE name LIKE '%DogPlanner%' OR name LIKE '%Test%';

-- ================================================================
-- KLAR! Fakturaunderlaget är nu implementerat
-- ================================================================

-- Verifiera installation:
SELECT 
  'invoice_counters table' as component,
  COUNT(*) as count
FROM invoice_counters
UNION ALL
SELECT 
  'invoices with invoice_number',
  COUNT(*)
FROM invoices
WHERE invoice_number IS NOT NULL
UNION ALL
SELECT 
  'orgs with payment info',
  COUNT(*)
FROM orgs
WHERE bankgiro IS NOT NULL OR plusgiro IS NOT NULL;
