-- ============================================
-- GRANSKA ALLA TRIGGERS OCH FUNCTIONS
-- ============================================
-- Datum: 3 Dec 2025
-- Syfte: Verifiera att alla 33+ triggers fungerar korrekt
-- Fokus: Invoice triggers, org_id assignment, customer_number

-- ============================================
-- 1. LISTA ALLA TRIGGERS
-- ============================================

SELECT
  trigger_name,
  event_object_table as "Table",
  event_manipulation as "Event",
  action_timing as "Timing",
  action_statement as "Function Call"
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- ============================================
-- 2. RÄKNA TRIGGERS PER TABELL
-- ============================================

SELECT
  event_object_table as "Table",
  COUNT(*) as "Antal triggers"
FROM information_schema.triggers
WHERE trigger_schema = 'public'
GROUP BY event_object_table
ORDER BY COUNT(*) DESC;

-- ============================================
-- 3. KRITISKA TRIGGERS - VERIFIERA ATT DE FINNS
-- ============================================

SELECT
  trigger_name,
  event_object_table as "Table",
  CASE
    WHEN trigger_name IN (
      'create_prepayment_invoice_trigger',
      'create_invoice_on_checkout_trigger',
      'on_auth_user_created',
      'ensure_unique_customer_number_trigger'
    ) THEN '🎯 KRITISK TRIGGER'
    ELSE 'Standard trigger'
  END as "Priority"
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'create_prepayment_invoice_trigger',
    'create_invoice_on_checkout_trigger',
    'on_auth_user_created',
    'ensure_unique_customer_number_trigger'
  )
ORDER BY trigger_name;

-- ============================================
-- 4. LISTA ALLA FUNCTIONS
-- ============================================

SELECT
  routine_name as "Function Name",
  routine_type as "Type",
  data_type as "Returns",
  CASE
    WHEN routine_name IN (
      'create_prepayment_invoice',
      'create_invoice_on_checkout',
      'handle_new_user',
      'ensure_unique_customer_number_before_insert',
      'heal_user_missing_org'
    ) THEN '🎯 KRITISK FUNCTION'
    ELSE 'Standard function'
  END as "Priority"
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- ============================================
-- 5. VERIFIERA INVOICE TRIGGERS
-- ============================================

-- Kolla att create_prepayment_invoice_trigger finns på bookings
SELECT
  trigger_name,
  event_object_table,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'bookings'
  AND trigger_name LIKE '%invoice%'
ORDER BY trigger_name;

-- ============================================
-- 6. VERIFIERA AUTH TRIGGERS
-- ============================================

-- Kolla att on_auth_user_created finns
SELECT
  trigger_name,
  event_object_table,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND (trigger_name LIKE '%auth%' OR trigger_name LIKE '%user%')
ORDER BY trigger_name;

-- ============================================
-- 7. VERIFIERA CUSTOMER NUMBER TRIGGERS
-- ============================================

-- Kolla att customer_number triggers finns på owners
SELECT
  trigger_name,
  event_object_table,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'owners'
ORDER BY trigger_name;

-- ============================================
-- 8. KOLLA FUNCTION SOURCE CODE (VIKTIGT!)
-- ============================================

-- Visa source code för create_prepayment_invoice
SELECT
  routine_name,
  routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'create_prepayment_invoice';

-- ============================================
-- 9. KOLLA OM INVOICE FUNCTIONS SKRIVER TILL 'amount'
-- ============================================

-- KRITISKT: 'amount' är GENERATED COLUMN och får ALDRIG skrivas till manuellt
-- Kolla om create_prepayment_invoice eller create_invoice_on_checkout
-- innehåller 'amount' i INSERT statements

SELECT
  routine_name,
  CASE
    WHEN routine_definition LIKE '%INSERT%amount%' THEN '❌ SKRIVER TILL amount (FEL!)'
    WHEN routine_definition LIKE '%amount%' THEN '⚠️ Nämner amount (kolla närmare)'
    ELSE '✅ Skriver INTE till amount'
  END as "amount column check"
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('create_prepayment_invoice', 'create_invoice_on_checkout')
ORDER BY routine_name;

-- ============================================
-- 10. TOTAL SAMMANFATTNING
-- ============================================

SELECT
  'Triggers' as "Type",
  COUNT(*) as "Totalt antal"
FROM information_schema.triggers
WHERE trigger_schema = 'public'

UNION ALL

SELECT
  'Functions' as "Type",
  COUNT(*) as "Totalt antal"
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_type = 'FUNCTION';
