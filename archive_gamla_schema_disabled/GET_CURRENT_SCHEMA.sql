-- ============================================================
-- GENERATE CURRENT SCHEMA FROM DEPLOYED DATABASE
-- ============================================================
-- Run this in Supabase SQL Editor to get the EXACT current schema
-- Copy the output and save it to schema.sql
-- ============================================================

-- Get all table definitions
SELECT 
  'CREATE TABLE ' || schemaname || '.' || tablename || E' (\n' ||
  string_agg(
    '  ' || column_name || ' ' || data_type || 
    CASE 
      WHEN character_maximum_length IS NOT NULL 
      THEN '(' || character_maximum_length || ')' 
      ELSE '' 
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END,
    E',\n'
  ) || E'\n);' as table_definition
FROM information_schema.columns
WHERE schemaname = 'public'
  AND tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
GROUP BY schemaname, tablename
ORDER BY tablename;

-- Get all indexes
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Get all foreign keys
SELECT
  tc.table_schema, 
  tc.table_name, 
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, tc.constraint_name;

-- Get all functions (simplified - only names and return types)
SELECT 
  n.nspname as schema,
  p.proname as function_name,
  pg_get_function_result(p.oid) as return_type,
  pg_get_function_arguments(p.oid) as arguments
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'public'
  AND p.prokind = 'f'
ORDER BY p.proname;

-- Get all triggers (we already have this from your earlier query)
SELECT 
  t.tgname AS trigger_name,
  c.relname AS table_name,
  p.proname AS function_name
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE NOT t.tgisinternal
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
ORDER BY c.relname, t.tgname;

-- Get all RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
