-- ============================================================================
-- TEST SCRIPT FÖR NYA INVOICE IMPROVEMENTS
-- ============================================================================
-- Kör detta i Supabase SQL Editor för att verifiera installation

-- Test 1: Verifiera att invoice_runs tabellen finns
SELECT 
  'invoice_runs table' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoice_runs')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Test 2: Verifiera invoice_number kolumn
SELECT 
  'invoice_number column' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'invoice_number')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Test 3: Verifiera sent_at kolumn
SELECT 
  'sent_at column' as test,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'invoices' AND column_name = 'sent_at')
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Test 4: Testa generate_invoice_number() function
SELECT 
  'generate_invoice_number()' as test,
  generate_invoice_number((SELECT id FROM orgs LIMIT 1)) as result;

-- Test 5: Visa invoice_runs summary
SELECT * FROM invoice_runs_summary;

-- Test 6: Kolla att län/kommun/service_types finns i orgs
SELECT 
  'org location fields' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_name = 'orgs' 
        AND column_name IN ('lan', 'kommun', 'service_types')
    )
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

-- Test 7: Kolla att handle_new_user trigger är uppdaterad
SELECT 
  'handle_new_user trigger' as test,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_trigger 
      WHERE tgname = 'on_auth_user_created'
    )
    THEN '✅ EXISTS'
    ELSE '❌ MISSING'
  END as status;

