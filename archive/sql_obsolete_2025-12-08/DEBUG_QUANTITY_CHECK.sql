-- ============================================================
-- DEBUG: Hitta var 'quantity' fortfarande används
-- ============================================================

-- Hämta den fullständiga funktionskoden för båda funktionerna
SELECT 
  proname as function_name,
  pg_get_functiondef(oid) as full_definition
FROM pg_proc 
WHERE proname IN ('create_prepayment_invoice', 'create_invoice_on_checkout');

-- Detta visar exakt vad som finns i databasen just nu
