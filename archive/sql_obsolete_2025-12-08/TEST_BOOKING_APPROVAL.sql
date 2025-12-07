-- ============================================================
-- TEST: Prova faktiskt godkänna en bokning
-- ============================================================
-- Detta simulerar vad som händer när man godkänner en bokning
-- ============================================================

-- STEG 1: Hitta en pending bokning att testa med
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

-- Kopiera ett 'id' från resultatet ovan och använd nedan


-- STEG 2: Testa att uppdatera status (ANVÄND RÄTT ID!)
-- OBS: Byt ut 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX' med ett riktigt booking-id!

-- BEGIN;
-- 
-- UPDATE bookings 
-- SET status = 'confirmed'
-- WHERE id = 'XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX';
-- 
-- ROLLBACK;  -- <-- Ångrar ändringen så inget sparas

-- Om du får FEL här, kopiera felmeddelandet!
-- Om det fungerar, kör ROLLBACK och testa sedan från UI


-- STEG 3: Om det fungerar, kontrollera att faktura skapades
-- SELECT 
--   i.id,
--   i.invoice_type,
--   i.total_amount,
--   ii.description,
--   ii.qty,
--   ii.amount
-- FROM invoices i
-- JOIN invoice_items ii ON ii.invoice_id = i.id
-- WHERE i.created_at > NOW() - INTERVAL '5 minutes'
-- ORDER BY i.created_at DESC;
