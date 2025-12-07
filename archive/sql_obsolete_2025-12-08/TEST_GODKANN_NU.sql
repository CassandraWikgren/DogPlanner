-- ============================================================
-- TEST: Godkänn bokning och se om det fungerar
-- ============================================================

-- Vi testar med den första bokningen: 2b69efb6-9fb7-43eb-b500-8d6f3d18b1fe

BEGIN;

-- Försök godkänna bokningen
UPDATE bookings 
SET status = 'confirmed' 
WHERE id = '2b69efb6-9fb7-43eb-b500-8d6f3d18b1fe';

-- Om INGET FEL här = ✅ Triggern fungerar!
-- Om fel "column quantity does not exist" = ❌ Triggern är inte fixad

-- Kolla att faktura skapades med RÄTT kolumnnamn
SELECT 
  i.id as invoice_id,
  i.invoice_type,
  i.total_amount,
  i.status,
  i.created_at,
  COUNT(ii.id) as antal_fakturarader
FROM invoices i
LEFT JOIN invoice_items ii ON ii.invoice_id = i.id
WHERE i.created_at > NOW() - INTERVAL '1 minute'
GROUP BY i.id, i.invoice_type, i.total_amount, i.status, i.created_at
ORDER BY i.created_at DESC;

-- Om du ser en faktura = ✅ FUNGERAR!

-- Visa fakturarader i detalj
SELECT 
  ii.description,
  ii.qty,        -- <-- Ska finnas (om quantity = FEL!)
  ii.unit_price,
  ii.amount      -- <-- Ska finnas (om total_amount = FEL!)
FROM invoices i
JOIN invoice_items ii ON ii.invoice_id = i.id
WHERE i.created_at > NOW() - INTERVAL '1 minute'
ORDER BY i.created_at DESC;

-- Om du ser qty och amount = ✅ PERFEKT!

ROLLBACK;  -- <-- Ångrar testet så bokningen blir pending igen

-- ============================================================
-- Om testet fungerade:
-- 1. Commit istället för rollback (ta bort ROLLBACK ovan)
-- 2. Eller testa i UI på riktigt
-- 
-- Om testet FAILADE:
-- 1. Kör ULTRA_FIX_CHECKOUT.sql
-- 2. Testa igen
-- ============================================================
