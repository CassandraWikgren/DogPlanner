-- ============================================================
-- SNABB TEST: Fungerar bokningsgodkännande?
-- ============================================================

-- STEG 1: Skapa en test-bokning (om du inte har någon pending)
-- Hoppa över detta om du redan har pending-bokningar

-- INSERT INTO bookings (
--   org_id,
--   dog_id,
--   start_date,
--   end_date,
--   status,
--   total_price,
--   base_price
-- )
-- SELECT 
--   d.org_id,
--   d.id as dog_id,
--   CURRENT_DATE + 7 as start_date,
--   CURRENT_DATE + 10 as end_date,
--   'pending' as status,
--   1500 as total_price,
--   1500 as base_price
-- FROM dogs d
-- LIMIT 1;


-- STEG 2: Testa att godkänna en bokning
-- Hitta en pending bokning:
SELECT 
  id,
  dog_id,
  start_date,
  end_date,
  status,
  total_price,
  prepayment_invoice_id
FROM bookings 
WHERE status = 'pending'
ORDER BY created_at DESC
LIMIT 1;

-- Kopiera booking ID från ovan och använd nedan:
-- (Ersätt 'BOKNINGS_ID_HÄR' med det riktiga ID:t)

BEGIN;

-- Försök uppdatera status till confirmed
UPDATE bookings 
SET status = 'confirmed' 
WHERE id = 'BOKNINGS_ID_HÄR';

-- Om INGET FEL: Kolla att faktura skapades
SELECT 
  i.id as invoice_id,
  i.invoice_type,
  i.total_amount,
  i.status,
  ii.description,
  ii.qty,
  ii.unit_price,
  ii.amount
FROM invoices i
LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
WHERE i.created_at > NOW() - INTERVAL '1 minute'
ORDER BY i.created_at DESC;

-- Om du ser en faktura med qty och amount = ✅ FUNGERAR!

ROLLBACK;  -- Ångrar hela testet


-- Om du fick fel "column quantity does not exist":
-- Kör hela FORCE_UPDATE_TRIGGERS.sql igen från början
