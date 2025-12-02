-- ============================================================
-- ENKEL VERIFIERING: Är triggers uppdaterade?
-- ============================================================

-- 1. Kontrollera att funktionerna finns
SELECT 
  p.proname as function_name,
  'Finns' as status
FROM pg_proc p
WHERE p.proname IN ('create_prepayment_invoice', 'create_invoice_on_checkout')
ORDER BY p.proname;

-- Förväntat: 2 rader


-- 2. Kontrollera att triggers finns
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_statement as calls_function
FROM information_schema.triggers
WHERE trigger_name IN ('trg_create_prepayment_invoice', 'trg_create_invoice_on_checkout')
ORDER BY trigger_name;

-- Förväntat: 2 rader


-- 3. TEST: Försök godkänna en pending bokning (simulering)
-- Hitta en pending bokning först:
SELECT 
  id,
  dog_id,
  start_date,
  end_date,
  status,
  total_price
FROM bookings 
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 3;

-- Om du ser bokningar ovan, kopiera ett ID och testa:
-- (Ersätt XXXXXXXX med ett riktigt ID från listan ovan)

-- BEGIN;
-- UPDATE bookings SET status = 'confirmed' WHERE id = 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX';
-- ROLLBACK;

-- Om du INTE får något fel = ✅ FUNGERAR!
-- Om du får fel om "quantity" = ❌ Kör FORCE_UPDATE_TRIGGERS.sql igen
