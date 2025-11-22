-- ============================================================
-- KOMPLETT DATABAS-REVISION
-- ============================================================
-- Kör denna i Supabase SQL Editor för att se exakt vad som finns
-- Spar resultatet så vi kan jämföra med schema.sql
-- ============================================================

-- 1. ALLA TRIGGERS
-- ============================================================
SELECT 
  '🎯 TRIGGERS' as category,
  trigger_schema,
  trigger_name,
  event_object_table as table_name,
  action_timing as timing,
  event_manipulation as event,
  action_statement as function_call
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 2. ALLA FUNKTIONER (relevanta för DogPlanner)
-- ============================================================
SELECT 
  '⚙️ FUNCTIONS' as category,
  routine_name as function_name,
  routine_type as type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND (
    routine_name LIKE '%customer%' OR
    routine_name LIKE '%org%' OR
    routine_name LIKE '%dog%' OR
    routine_name LIKE '%owner%' OR
    routine_name LIKE '%booking%' OR
    routine_name LIKE '%handle%' OR
    routine_name LIKE '%heal%' OR
    routine_name LIKE '%invoice%' OR
    routine_name LIKE '%auto%'
  )
ORDER BY routine_name;

-- 3. ALLA RLS POLICIES
-- ============================================================
SELECT 
  '🔒 POLICIES' as category,
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  roles,
  qual as using_expression,
  with_check as check_expression
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- 4. KRITISKA TABELLER - STRUKTUR
-- ============================================================
SELECT 
  '📋 TABLES' as category,
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    'owners',
    'dogs', 
    'bookings',
    'profiles',
    'organisations',
    'invoices',
    'rooms',
    'interest_applications'
  )
ORDER BY table_name, ordinal_position;

-- 5. SEQUENCES
-- ============================================================
SELECT 
  '🔢 SEQUENCES' as category,
  sequence_name,
  data_type,
  start_value,
  minimum_value,
  maximum_value,
  increment
FROM information_schema.sequences
WHERE sequence_schema = 'public'
ORDER BY sequence_name;

-- 6. FOREIGN KEYS
-- ============================================================
SELECT 
  '🔗 FOREIGN_KEYS' as category,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  rc.update_rule,
  rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
JOIN information_schema.referential_constraints AS rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

-- 7. INDEXES
-- ============================================================
SELECT 
  '📇 INDEXES' as category,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- 8. TRIGGER CONFLICTS - CUSTOMER_NUMBER
-- ============================================================
SELECT 
  '⚠️ CUSTOMER_NUMBER_TRIGGERS' as category,
  trigger_name,
  event_manipulation,
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'owners'
  AND trigger_name LIKE '%customer%'
ORDER BY trigger_name;

-- 9. ORG_ID TRIGGERS
-- ============================================================
SELECT 
  '⚠️ ORG_ID_TRIGGERS' as category,
  event_object_table as table_name,
  trigger_name,
  action_statement as function_call
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND (
    trigger_name LIKE '%org%' OR
    action_statement LIKE '%org_id%'
  )
ORDER BY event_object_table, trigger_name;

-- 10. CHECK DUPLICATES - SAMMA TRIGGER PÅ SAMMA TABELL
-- ============================================================
SELECT 
  '🚨 DUPLICATE_TRIGGERS' as category,
  event_object_table,
  COUNT(*) as trigger_count,
  STRING_AGG(trigger_name, ', ') as trigger_names
FROM information_schema.triggers
WHERE trigger_schema = 'public'
GROUP BY event_object_table, event_manipulation, action_timing
HAVING COUNT(*) > 1
ORDER BY trigger_count DESC;

-- 11. CUSTOMER_NUMBER SEQUENCE STATUS
-- ============================================================
SELECT 
  '🔢 CUSTOMER_NUMBER_SEQ' as category,
  last_value as current_value,
  (SELECT MAX(customer_number) FROM owners) as max_in_table,
  (SELECT COUNT(*) FROM owners WHERE customer_number IS NOT NULL) as total_with_number,
  (SELECT COUNT(*) FROM owners WHERE customer_number IS NULL) as total_without_number
FROM owners_customer_number_seq;

-- 12. ORG_ID NULL-värden (ska INTE finnas i profiles efter fix)
-- ============================================================
SELECT 
  '⚠️ MISSING_ORG_ID' as category,
  'profiles' as table_name,
  COUNT(*) as rows_without_org_id
FROM profiles
WHERE org_id IS NULL
UNION ALL
SELECT 
  '⚠️ MISSING_ORG_ID',
  'organisations',
  COUNT(*)
FROM organisations
WHERE id IS NULL;

-- ============================================================
-- INSTRUKTIONER
-- ============================================================
-- 1. Kör hela denna fil i Supabase SQL Editor
-- 2. Exportera resultaten (eller kopiera till textfil)
-- 3. Dela med mig så kan jag jämföra med schema.sql
-- 4. Vi kan då identifiera:
--    - Triggers som finns dubbelt
--    - Funktioner som är föråldrade
--    - Policies som saknas
--    - Schema.sql som behöver uppdateras
-- ============================================================
