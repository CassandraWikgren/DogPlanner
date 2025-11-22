-- =====================================================
-- DATABAS HEALTH CHECK
-- =====================================================
-- Använd: Kör dessa queries regelbundet för att övervaka systemets hälsa
-- Datum: 2025-11-22
-- =====================================================

-- =====================================================
-- 1. KRITISK: Användare utan org_id
-- =====================================================
-- Dessa användare kommer få "Ingen organisation tilldelad" fel
SELECT 
  'CRITICAL: Users without org_id' as check_name,
  COUNT(*) FILTER (WHERE org_id IS NULL) as affected_users,
  COUNT(*) as total_users,
  ROUND(100.0 * COUNT(*) FILTER (WHERE org_id IS NOT NULL) / NULLIF(COUNT(*), 0), 2) as coverage_percent
FROM profiles;

-- Lista specifika användare utan org_id (för debugging)
SELECT 
  p.id,
  p.email,
  p.created_at,
  u.email as auth_email,
  u.raw_user_meta_data->>'org_name' as intended_org_name
FROM profiles p
LEFT JOIN auth.users u ON u.id = p.id
WHERE p.org_id IS NULL
ORDER BY p.created_at DESC;

-- =====================================================
-- 2. KRITISK: Organisationer utan admin
-- =====================================================
-- Dessa organisationer kan inte hanteras
SELECT 
  'CRITICAL: Orgs without admin' as check_name,
  o.id as org_id,
  o.name as org_name,
  o.email as org_email,
  COUNT(p.id) as total_users,
  COUNT(p.id) FILTER (WHERE p.role = 'admin') as admin_count,
  array_agg(p.email) FILTER (WHERE p.role = 'admin') as admin_emails
FROM orgs o
LEFT JOIN profiles p ON p.org_id = o.id
GROUP BY o.id, o.name, o.email
HAVING COUNT(p.id) FILTER (WHERE p.role = 'admin') = 0
ORDER BY o.created_at DESC;

-- =====================================================
-- 3. VERIFIERING: Kritiska trigger-funktioner
-- =====================================================
SELECT 
  'Trigger Functions Status' as check_name,
  routine_name,
  routine_type,
  CASE 
    WHEN routine_name IN (
      'handle_new_user',
      'heal_user_missing_org',
      'create_invoice_on_checkout',
      'create_prepayment_invoice',
      'set_booking_org_id',
      'auto_match_owner_trigger'
    ) THEN '✅ EXISTS'
    ELSE '⚠️ UNEXPECTED'
  END as status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'handle_new_user',
    'heal_user_missing_org',
    'create_invoice_on_checkout',
    'create_prepayment_invoice',
    'set_booking_org_id',
    'auto_match_owner_trigger',
    'set_dog_org_id',
    'set_org_id_for_rooms'
  )
ORDER BY routine_name;

-- Kontrollera om heal_user_missing_org SAKNAS (KRITISKT!)
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '❌ MISSING: heal_user_missing_org - KÖR FIX_01_ADD_HEALING_FUNCTION.sql!'
    ELSE '✅ OK: heal_user_missing_org exists'
  END as healing_function_status
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'heal_user_missing_org';

-- =====================================================
-- 4. VERIFIERING: Aktiva triggers
-- =====================================================
SELECT 
  'Active Triggers' as check_name,
  event_object_table as table_name,
  trigger_name,
  event_manipulation as event_type,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name IN (
    'on_auth_user_created',
    'trg_create_invoice_on_checkout',
    'trg_create_prepayment_invoice',
    'trg_set_booking_org_id',
    'trg_auto_match_owner',
    'trg_set_dog_org_id',
    'trg_set_org_id_rooms'
  )
ORDER BY event_object_table, trigger_name;

-- =====================================================
-- 5. RLS POLICY ÖVERBLICK
-- =====================================================
-- Identifiera tabeller med många policies (potentiell konfliktrisk)
SELECT 
  'RLS Policy Count' as check_name,
  schemaname,
  tablename,
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) > 10 THEN '⚠️ MANY'
    WHEN COUNT(*) > 5 THEN '📊 MODERATE'
    ELSE '✅ OK'
  END as status
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY schemaname, tablename
HAVING COUNT(*) > 3
ORDER BY COUNT(*) DESC;

-- =====================================================
-- 6. SUBSCRIPTION SYSTEM STATUS
-- =====================================================
-- Vilken subscription-tabell används egentligen?
SELECT 'Subscriptions Table Comparison' as check_name;

-- Kolla subscriptions-tabellen
SELECT 
  'subscriptions' as table_name,
  COUNT(*) as row_count,
  MAX(created_at) as latest_entry,
  MIN(created_at) as earliest_entry
FROM subscriptions
WHERE EXISTS (SELECT 1 FROM subscriptions LIMIT 1);

-- Kolla org_subscriptions-tabellen
SELECT 
  'org_subscriptions' as table_name,
  COUNT(*) as row_count,
  MAX(created_at) as latest_entry,
  MIN(created_at) as earliest_entry
FROM org_subscriptions
WHERE EXISTS (SELECT 1 FROM org_subscriptions LIMIT 1);

-- =====================================================
-- 7. FAKTURERING STATUS
-- =====================================================
-- Kontrollera att fakturering fungerar
SELECT 
  'Invoice Generation Status' as check_name,
  COUNT(*) as total_invoices,
  COUNT(*) FILTER (WHERE invoice_type = 'prepayment') as prepayment_invoices,
  COUNT(*) FILTER (WHERE invoice_type = 'afterpayment') as afterpayment_invoices,
  COUNT(*) FILTER (WHERE status = 'draft') as draft_invoices,
  COUNT(*) FILTER (WHERE status = 'sent') as sent_invoices,
  COUNT(*) FILTER (WHERE status = 'paid') as paid_invoices,
  MAX(created_at) as latest_invoice
FROM invoices;

-- Bokningar utan faktura (borde ha afterpayment_invoice_id)
SELECT 
  'Bookings Missing Invoices' as check_name,
  COUNT(*) as bookings_without_invoice
FROM bookings
WHERE status = 'checked_out'
  AND afterpayment_invoice_id IS NULL;

-- =====================================================
-- 8. ÄGARE OCH HUNDAR STATUS
-- =====================================================
-- Hundar utan ägare (borde auto-matchas)
SELECT 
  'Dogs without Owner' as check_name,
  COUNT(*) as dogs_without_owner,
  array_agg(name) FILTER (WHERE owner_id IS NULL) as dog_names
FROM dogs
WHERE owner_id IS NULL;

-- Ägare utan customer_number
SELECT 
  'Owners without Customer Number' as check_name,
  COUNT(*) as affected_owners
FROM owners
WHERE customer_number IS NULL;

-- =====================================================
-- 9. AUTH USERS VS PROFILES SYNC
-- =====================================================
-- Auth users som saknar profile
SELECT 
  'Auth Users without Profile' as check_name,
  COUNT(*) as missing_profiles
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM profiles p WHERE p.id = u.id
);

-- Profiles som saknar auth user (borde inte hända)
SELECT 
  'Profiles without Auth User' as check_name,
  COUNT(*) as orphaned_profiles
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM auth.users u WHERE u.id = p.id
);

-- =====================================================
-- 10. SAMMANFATTNING
-- =====================================================
SELECT 
  '=== HEALTH CHECK SUMMARY ===' as summary,
  (SELECT COUNT(*) FROM profiles WHERE org_id IS NULL) as users_without_org,
  (SELECT COUNT(*) FROM orgs o WHERE NOT EXISTS (
    SELECT 1 FROM profiles p WHERE p.org_id = o.id AND p.role = 'admin'
  )) as orgs_without_admin,
  (SELECT COUNT(*) FROM dogs WHERE owner_id IS NULL) as dogs_without_owner,
  (SELECT COUNT(*) FROM bookings WHERE status = 'checked_out' AND afterpayment_invoice_id IS NULL) as bookings_without_invoice,
  (SELECT CASE WHEN COUNT(*) > 0 THEN 'YES ✅' ELSE 'NO ❌' END FROM information_schema.routines WHERE routine_name = 'heal_user_missing_org') as heal_function_exists;

-- =====================================================
-- ANVÄNDNING
-- =====================================================
-- 1. Kör alla queries i Supabase SQL Editor
-- 2. Granska resultaten för varje sektion
-- 3. Åtgärda problem enligt SYSTEM_AUDIT_KOMPLETT_2025-11-22.md
-- 4. Kör igen tills alla ✅ är gröna
--
-- REKOMMENDERAD FREKVENS:
-- - Dagligen under utveckling
-- - Veckovis i produktion
-- - Efter varje större migration
-- =====================================================
