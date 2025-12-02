-- ============================================================
-- EXAKT DIAGNOS: Hitta var quantity används i INSERT
-- ============================================================

-- Visa hela create_invoice_on_checkout funktionen
SELECT pg_get_functiondef(oid) as full_function
FROM pg_proc 
WHERE proname = 'create_invoice_on_checkout';

-- Leta efter patterns som:
-- INSERT INTO invoice_items (
--   ...
--   quantity,    <-- Detta är FEL
--   ...
-- )
--
-- vs
-- INSERT INTO invoice_items (
--   ...
--   qty,        <-- Detta är RÄTT
--   ...
-- )
