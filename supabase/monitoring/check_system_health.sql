-- ====================================
-- SYSTEM HEALTH CHECK
-- Kontrollera triggers, funktioner och RLS policies
-- ====================================

-- 1. Kontrollera alla triggers
SELECT 
  'TRIGGERS' as check_type,
  n.nspname as schema_name,
  c.relname as table_name,
  COUNT(*) as trigger_count
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT tgisinternal
  AND n.nspname = 'public'
GROUP BY n.nspname, c.relname
ORDER BY c.relname;

-- 2. Kontrollera vilka triggers som är aktiva
SELECT 
  'ACTIVE_TRIGGERS' as check_type,
  n.nspname as schema_name,
  c.relname as table_name,
  t.tgname as trigger_name,
  pg_get_triggerdef(t.oid) as trigger_definition,
  CASE 
    WHEN t.tgenabled = 'O' THEN 'ENABLED'
    WHEN t.tgenabled = 'D' THEN 'DISABLED'
    WHEN t.tgenabled = 'R' THEN 'REPLICA'
    WHEN t.tgenabled = 'A' THEN 'ALWAYS'
    ELSE 'UNKNOWN'
  END as status
FROM pg_trigger t
JOIN pg_class c ON t.tgrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE NOT t.tgisinternal
  AND n.nspname = 'public'
ORDER BY c.relname, t.tgname;

-- 3. Kontrollera RLS policies
SELECT 
  'RLS_POLICIES' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd as command,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 4. Kontrollera om RLS är aktiverat på alla tabeller
SELECT 
  'RLS_STATUS' as check_type,
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- 5. Kontrollera alla custom functions
SELECT 
  'FUNCTIONS' as check_type,
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_functiondef(p.oid) as definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;

-- 6. Kontrollera för orphaned records (records utan kopplingar)
SELECT 
  'ORPHANED_DOGS' as check_type,
  COUNT(*) as count
FROM dogs
WHERE owner_id NOT IN (SELECT id FROM owners);

SELECT 
  'ORPHANED_BOOKINGS' as check_type,
  COUNT(*) as count
FROM bookings
WHERE dog_id NOT IN (SELECT id FROM dogs)
   OR owner_id NOT IN (SELECT id FROM owners);

-- 7. Kontrollera för missing org_id (kritiskt!)
SELECT 
  'PROFILES_MISSING_ORG' as check_type,
  COUNT(*) as count
FROM profiles
WHERE org_id IS NULL;

SELECT 
  'OWNERS_MISSING_ORG' as check_type,
  COUNT(*) as count
FROM owners
WHERE org_id IS NULL;

-- 8. Kontrollera trigger execution log (om vi implementerar det)
-- CREATE TABLE IF NOT EXISTS trigger_execution_log (
--   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
--   trigger_name TEXT NOT NULL,
--   table_name TEXT NOT NULL,
--   operation TEXT NOT NULL,
--   row_id UUID,
--   success BOOLEAN NOT NULL,
--   error_message TEXT,
--   executed_at TIMESTAMPTZ DEFAULT NOW()
-- );
