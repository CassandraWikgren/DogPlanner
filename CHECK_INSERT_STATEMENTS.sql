-- ============================================================
-- EXAKT FIX: Kontrollera INSERT-satserna
-- ============================================================
-- Kör detta för att se exakt vilka INSERT-satser som finns
-- ============================================================

-- Visa alla rader i create_invoice_on_checkout som innehåller 'INSERT INTO invoice_items'
SELECT 
  proname,
  regexp_split_to_table(
    pg_get_functiondef(oid), 
    E'\n'
  ) as line
FROM pg_proc 
WHERE proname = 'create_invoice_on_checkout'
  AND regexp_split_to_table(pg_get_functiondef(oid), E'\n') 
      LIKE '%INSERT INTO invoice_items%';

-- Detta visar alla INSERT-rader så vi kan se om någon fortfarande har fel kolumnnamn
