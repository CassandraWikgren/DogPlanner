-- =====================================================
-- Lägg till due_date kolumn i invoices tabellen
-- =====================================================
-- Denna kolumn behövs för att hantera förfallodatum på fakturor
-- från både månadsfakturering och förskotts-/efterskottssystemet
-- =====================================================

ALTER TABLE invoices ADD COLUMN IF NOT EXISTS due_date DATE;

COMMENT ON COLUMN invoices.due_date IS 'Förfallodatum för fakturan';

-- Sätt ett rimligt default för befintliga fakturor (30 dagar från invoice_date)
UPDATE invoices 
SET due_date = invoice_date + INTERVAL '30 days'
WHERE due_date IS NULL;

-- Verifiera att kolumnen finns
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'invoices' 
  AND column_name = 'due_date';
