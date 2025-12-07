-- ============================================================
-- 📊 HEALTH CHECK - Production monitoring queries
-- ============================================================
-- Datum: 2025-12-02
-- Syfte: Övervaka systemhälsa och hitta problem tidigt
-- Användning: Kör dessa i Supabase SQL Editor varje vecka
-- ============================================================

-- ============================================================
-- 1️⃣ SYSTEM OVERVIEW
-- ============================================================

SELECT 
  '=== SYSTEM HEALTH CHECK ===' as section,
  NOW() as timestamp;

-- ============================================================
-- 2️⃣ TABLE ROW COUNTS
-- ============================================================

SELECT 
  'Table Row Counts' as section,
  'grooming_bookings' as table_name,
  COUNT(*) as total_rows,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7_days,
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days') as last_30_days
FROM grooming_bookings
UNION ALL
SELECT 
  'Table Row Counts',
  'grooming_journal',
  COUNT(*),
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days'),
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')
FROM grooming_journal
UNION ALL
SELECT 
  'Table Row Counts',
  'grooming_prices',
  COUNT(*),
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days'),
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')
FROM grooming_prices
UNION ALL
SELECT 
  'Table Row Counts',
  'boarding_seasons',
  COUNT(*),
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days'),
  0
FROM boarding_seasons
UNION ALL
SELECT 
  'Table Row Counts',
  'special_dates',
  COUNT(*),
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days'),
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')
FROM special_dates
UNION ALL
SELECT 
  'Table Row Counts',
  'bookings',
  COUNT(*),
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days'),
  COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '30 days')
FROM bookings
UNION ALL
SELECT 
  'Table Row Counts',
  'invoices',
  COUNT(*),
  COUNT(*) FILTER (WHERE invoice_date > NOW() - INTERVAL '7 days'),
  COUNT(*) FILTER (WHERE invoice_date > NOW() - INTERVAL '30 days')
FROM invoices
ORDER BY table_name;

-- ============================================================
-- 3️⃣ RLS STATUS CHECK
-- ============================================================

SELECT 
  'RLS Status' as section,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ RLS AKTIVT (bra för production)'
    ELSE '⚠️ RLS AVSTÄNGT (endast OK för dev)'
  END as status,
  (SELECT COUNT(*) 
   FROM pg_policies 
   WHERE tablename = pt.tablename) as policy_count
FROM pg_tables pt
WHERE schemaname = 'public'
  AND tablename IN (
    'grooming_bookings', 
    'grooming_journal', 
    'grooming_prices',
    'boarding_seasons',
    'special_dates',
    'bookings',
    'dogs',
    'owners',
    'invoices'
  )
ORDER BY tablename;

-- ============================================================
-- 4️⃣ INVOICE TRIGGER STATUS
-- ============================================================

SELECT 
  'Invoice Triggers' as section,
  trigger_name,
  event_manipulation as event_type,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'bookings'
  AND trigger_name IN (
    'trg_create_prepayment_invoice',
    'trg_create_invoice_on_checkout'
  )
ORDER BY trigger_name;

-- ============================================================
-- 5️⃣ RECENT BOOKINGS & INVOICE STATUS
-- ============================================================

SELECT 
  'Recent Bookings' as section,
  b.id,
  b.start_date,
  b.status,
  b.total_price,
  CASE WHEN b.prepayment_invoice_id IS NOT NULL THEN '✅' ELSE '❌' END as has_prepayment,
  CASE WHEN b.afterpayment_invoice_id IS NOT NULL THEN '✅' ELSE '❌' END as has_final_invoice,
  o.org_name
FROM bookings b
JOIN dogs d ON b.dog_id = d.id
LEFT JOIN owners ow ON d.owner_id = ow.id
LEFT JOIN orgs o ON b.org_id = o.id
WHERE b.created_at > NOW() - INTERVAL '30 days'
ORDER BY b.created_at DESC
LIMIT 10;

-- ============================================================
-- 6️⃣ ORPHANED DATA CHECK
-- ============================================================

-- Grooming bookings utan org_id (BUG!)
SELECT 
  'Orphaned Data' as section,
  'grooming_bookings without org_id' as issue,
  COUNT(*) as count
FROM grooming_bookings
WHERE org_id IS NULL
UNION ALL
-- Special dates utan org_id
SELECT 
  'Orphaned Data',
  'special_dates without org_id',
  COUNT(*)
FROM special_dates
WHERE org_id IS NULL
UNION ALL
-- Users utan org_id
SELECT 
  'Orphaned Data',
  'profiles without org_id',
  COUNT(*)
FROM profiles
WHERE org_id IS NULL;

-- ============================================================
-- 7️⃣ PERFORMANCE METRICS
-- ============================================================

-- Största tabeller
SELECT 
  'Table Sizes' as section,
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
  pg_size_pretty(pg_relation_size(schemaname||'.'||tablename)) as table_size,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) - pg_relation_size(schemaname||'.'||tablename)) as index_size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC
LIMIT 10;

-- ============================================================
-- 8️⃣ MISSING INDEXES CHECK
-- ============================================================

SELECT 
  'Missing Indexes' as section,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN (
    'grooming_bookings',
    'grooming_journal', 
    'grooming_prices',
    'boarding_seasons',
    'special_dates'
  )
ORDER BY tablename, indexname;

-- ============================================================
-- 9️⃣ ERROR INDICATORS
-- ============================================================

-- Invoices med 0 kr (potentiellt fel)
SELECT 
  'Potential Errors' as section,
  'Invoices with 0 total_amount' as issue_type,
  COUNT(*) as count,
  STRING_AGG(id::text, ', ' ORDER BY invoice_date DESC) as example_ids
FROM invoices
WHERE total_amount = 0
HAVING COUNT(*) > 0
UNION ALL
-- Invoice items med NULL amount (borde inte hända med GENERATED COLUMN)
SELECT 
  'Potential Errors',
  'Invoice items with NULL amount',
  COUNT(*),
  STRING_AGG(id::text, ', ')
FROM invoice_items
WHERE amount IS NULL
HAVING COUNT(*) > 0
UNION ALL
-- Bookings confirmed men utan prepayment invoice
SELECT 
  'Potential Errors',
  'Confirmed bookings without prepayment invoice',
  COUNT(*),
  STRING_AGG(id::text, ', ')
FROM bookings
WHERE status = 'confirmed' 
  AND prepayment_invoice_id IS NULL
  AND created_at > NOW() - INTERVAL '30 days'
HAVING COUNT(*) > 0;

-- ============================================================
-- 🔟 SUMMARY
-- ============================================================

SELECT 
  '=== HEALTH CHECK COMPLETE ===' as section,
  NOW() as completed_at,
  'Review output above for issues' as next_step;

-- ============================================================
-- ✅ HEALTHY SYSTEM INDICATORS:
-- 
-- 1. RLS enabled på alla viktiga tabeller
-- 2. Alla bookings har invoices när status = confirmed/checked_out
-- 3. Inga orphaned records (NULL org_id)
-- 4. Invoice triggers existerar
-- 5. Tabeller har rimliga row counts
-- 6. Indexes finns på org_id kolumner
-- 7. Inga invoices med 0 kr (såvida inte legitimt)
-- 
-- ⚠️ RED FLAGS:
-- 
-- - RLS avstängt i production
-- - Orphaned data (NULL org_id)
-- - Missing triggers
-- - 0 kr invoices utan förklaring
-- - Confirmed bookings utan invoices
-- ============================================================
