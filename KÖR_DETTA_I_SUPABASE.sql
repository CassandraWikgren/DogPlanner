-- ================================================================
-- VERIFIERING AV FAKTURERINGSSYSTEM
-- Kör detta i Supabase SQL Editor för att kontrollera systemet
-- ================================================================

-- 1. Kolla om pg_cron är aktivt (automatisk fakturering)
SELECT * FROM cron.job WHERE jobname = 'monthly-invoice-generation';
-- Förväntat: 1 rad med schedule = '0 8 1 * *'
-- Om TOM: Kör migration 20251122_setup_automatic_invoice_cron.sql

-- 2. Kolla daycare_pricing (varje org behöver en rad!)
SELECT 
  dp.org_id,
  o.name as org_name,
  dp.subscription_5days as "Heltid (5 dagar)",
  dp.subscription_3days as "Deltid 3",
  dp.subscription_2days as "Deltid 2",
  dp.sibling_discount_percent as "Syskonrabatt %"
FROM daycare_pricing dp
JOIN orgs o ON o.id = dp.org_id
ORDER BY o.name;
-- Om TOM eller saknas för din org: Lägg till priser!

-- 3. Kolla hundar med aktiva abonnemang
SELECT 
  d.name as "Hund",
  d.subscription as "Abonnemang",
  d.startdate as "Startdatum",
  d.enddate as "Slutdatum",
  o.full_name as "Ägare",
  org.name as "Organisation"
FROM dogs d
JOIN owners o ON o.id = d.owner_id
JOIN orgs org ON org.id = d.org_id
WHERE d.subscription IS NOT NULL 
AND d.subscription != ''
AND d.subscription != 'Dagshund'
ORDER BY org.name, o.full_name, d.name;
-- Dessa kommer att faktureras månadsvis!

-- 4. Senaste invoice_runs (cron execution logs)
SELECT 
  month_id as "Månad",
  status as "Status",
  invoices_created as "Antal fakturor",
  error_message as "Felmeddelande",
  metadata->>'timestamp' as "Kördes"
FROM invoice_runs
ORDER BY month_id DESC
LIMIT 5;

-- 5. Senaste fakturorna (kolla att priser INTE är 0!)
SELECT 
  i.invoice_number as "Fakturanummer",
  i.billed_name as "Kund",
  i.total_amount as "Belopp",
  i.status as "Status",
  o.name as "Organisation",
  i.created_at as "Skapad"
FROM invoices i
JOIN orgs o ON o.id = i.org_id
WHERE i.created_at > NOW() - INTERVAL '7 days'
ORDER BY i.created_at DESC
LIMIT 10;

-- 6. Fakturarader - kolla priser (SKA INTE vara 0!)
SELECT 
  i.invoice_number as "Faktura",
  ii.description as "Beskrivning",
  ii.unit_price as "Pris",
  ii.qty as "Antal",
  ii.amount as "Totalt"
FROM invoice_items ii
JOIN invoices i ON i.id = ii.invoice_id
WHERE i.created_at > NOW() - INTERVAL '7 days'
AND (ii.description LIKE '%Heltid%' OR ii.description LIKE '%Deltid%')
ORDER BY i.created_at DESC;

-- 7. 🚨 PROBLEM-DETEKTOR: Om du ser 0 kr här är något FEL!
SELECT 
  i.invoice_number as "Faktura med 0 kr (PROBLEM!)",
  ii.description as "Beskrivning",
  ii.unit_price as "Pris (ska INTE vara 0)"
FROM invoice_items ii
JOIN invoices i ON i.id = ii.invoice_id
WHERE ii.unit_price = 0
AND (ii.description LIKE '%Heltid%' OR ii.description LIKE '%Deltid%')
LIMIT 5;
-- Om denna query returnerar rader = Edge Function måste deployas med fixen!
-- Följ FAKTURERINGSSYSTEM_FIXED_DEPLOYMENT.md

-- ================================================================
-- OM DU BEHÖVER LÄGGA TILL PRISER FÖR DIN ORGANISATION:
-- ================================================================

-- Hitta ditt org_id:
-- SELECT id, name FROM orgs WHERE name LIKE '%ditt företag%';

-- Lägg till priser (byt ut 'DITT-ORG-ID' mot rätt UUID):
/*
INSERT INTO daycare_pricing (
  org_id, 
  subscription_5days,  -- Heltid (5 dagar/vecka)
  subscription_4days,  -- Deltid 4
  subscription_3days,  -- Deltid 3
  subscription_2days,  -- Deltid 2
  subscription_1day,   -- Deltid 1
  single_day_price,    -- Dagshund (drop-in)
  sibling_discount_percent,
  effective_from,
  updated_at
) VALUES (
  'DITT-ORG-ID',
  4500,  -- Heltid: 4500 kr/mån
  4000,  -- Deltid 4: 4000 kr/mån
  3300,  -- Deltid 3: 3300 kr/mån
  2500,  -- Deltid 2: 2500 kr/mån
  1500,  -- Deltid 1: 1500 kr/mån
  400,   -- Dagshund: 400 kr/dag
  10,    -- 10% syskonrabatt
  CURRENT_DATE,
  NOW()
);
*/

-- ================================================================
-- MANUELL TESTNING AV FAKTURAGENERERING
-- ================================================================

-- Om du vill testa fakturering för en specifik månad:
-- 1. Gå till Supabase Dashboard
-- 2. Edge Functions → generate_invoices
-- 3. Invoke med body: { "month": "2025-11" }
-- 4. Kolla invoice_runs och invoices tabellerna efter!

-- ================================================================
-- STATUSSAMMANFATTNING
-- ================================================================

-- Kör detta för en snabb översikt:
SELECT 
  'Cron Jobs' as "Kategori",
  COUNT(*) as "Antal"
FROM cron.job
UNION ALL
SELECT 
  'Organisationer med priser',
  COUNT(*)
FROM daycare_pricing
UNION ALL
SELECT 
  'Hundar med abonnemang',
  COUNT(*)
FROM dogs
WHERE subscription IS NOT NULL 
AND subscription != '' 
AND subscription != 'Dagshund'
UNION ALL
SELECT 
  'Fakturor senaste 30 dagarna',
  COUNT(*)
FROM invoices
WHERE created_at > NOW() - INTERVAL '30 days'
UNION ALL
SELECT 
  'Invoice runs senaste 30 dagarna',
  COUNT(*)
FROM invoice_runs;
