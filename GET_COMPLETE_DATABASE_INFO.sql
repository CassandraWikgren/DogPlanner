-- ============================================================================
-- KOMPLETT DATABAS-INFORMATION FÖR AI-ASSISTANS
-- Kör denna SQL i Supabase SQL Editor och kopiera HELA outputen
-- ============================================================================

-- 1️⃣ ALLA TABELLER OCH DERAS KOLUMNER
-- ============================================================================
SELECT 
  '=== TABELLER OCH KOLUMNER ===' as section,
  table_name,
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default,
  ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name NOT LIKE 'pg_%'
  AND table_name NOT LIKE 'sql_%'
ORDER BY table_name, ordinal_position;

-- 2️⃣ ALLA PRIMARY KEYS
-- ============================================================================
SELECT 
  '=== PRIMARY KEYS ===' as section,
  tc.table_name,
  kcu.column_name,
  tc.constraint_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'PRIMARY KEY'
ORDER BY tc.table_name;

-- 3️⃣ ALLA FOREIGN KEYS (KOPPLINGAR MELLAN TABELLER)
-- ============================================================================
SELECT 
  '=== FOREIGN KEYS ===' as section,
  tc.table_name as from_table,
  kcu.column_name as from_column,
  ccu.table_name as to_table,
  ccu.column_name as to_column,
  tc.constraint_name,
  rc.delete_rule,
  rc.update_rule
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu 
  ON ccu.constraint_name = tc.constraint_name
LEFT JOIN information_schema.referential_constraints rc
  ON rc.constraint_name = tc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'FOREIGN KEY'
ORDER BY tc.table_name, kcu.column_name;

-- 4️⃣ ALLA INDEXES
-- ============================================================================
SELECT 
  '=== INDEXES ===' as section,
  pi.schemaname,
  pi.tablename,
  pi.indexname,
  pi.indexdef
FROM pg_indexes pi
WHERE pi.schemaname = 'public'
ORDER BY pi.tablename, pi.indexname;

-- 5️⃣ ALLA RLS POLICIES (ROW LEVEL SECURITY)
-- ============================================================================
SELECT 
  '=== RLS POLICIES ===' as section,
  pp.schemaname,
  pp.tablename,
  pp.policyname,
  pp.permissive,
  pp.roles,
  pp.cmd,
  pp.qual,
  pp.with_check
FROM pg_policies pp
WHERE pp.schemaname = 'public'
ORDER BY pp.tablename, pp.policyname;

-- 6️⃣ RLS STATUS PÅ VARJE TABELL
-- ============================================================================
SELECT 
  '=== RLS STATUS ===' as section,
  pt.tablename,
  pt.rowsecurity as rls_enabled
FROM pg_tables pt
WHERE pt.schemaname = 'public'
ORDER BY pt.tablename;

-- 7️⃣ ALLA TRIGGERS
-- ============================================================================
SELECT 
  '=== TRIGGERS ===' as section,
  trigger_schema,
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing,
  action_orientation
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 8️⃣ ALLA FUNCTIONS/STORED PROCEDURES (RPC)
-- ============================================================================
SELECT 
  '=== FUNCTIONS (RPC) ===' as section,
  n.nspname as schema_name,
  p.proname as function_name,
  pg_get_function_arguments(p.oid) as arguments,
  pg_get_function_result(p.oid) as return_type,
  l.lanname as language,
  CASE 
    WHEN p.provolatile = 'i' THEN 'IMMUTABLE'
    WHEN p.provolatile = 's' THEN 'STABLE'
    WHEN p.provolatile = 'v' THEN 'VOLATILE'
  END as volatility,
  p.prosecdef as security_definer
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
JOIN pg_language l ON p.prolang = l.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'  -- Only functions, not aggregates
ORDER BY p.proname;

-- 9️⃣ FUNCTION SOURCE CODE (för specifika viktiga funktioner)
-- ============================================================================
SELECT 
  '=== FUNCTION SOURCE CODE ===' as section,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.proname IN (
    'handle_new_user',
    'heal_user_missing_org',
    'register_subscription_start',
    'calculate_yearly_refund',
    'gdpr_delete_user_data'
  )
ORDER BY p.proname;

-- 🔟 ALLA ENUM TYPES (om du använder några)
-- ============================================================================
SELECT 
  '=== ENUM TYPES ===' as section,
  t.typname as enum_name,
  e.enumlabel as enum_value,
  e.enumsortorder
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_namespace n ON t.typnamespace = n.oid
WHERE n.nspname = 'public'
ORDER BY t.typname, e.enumsortorder;

-- 1️⃣1️⃣ UNIQUE CONSTRAINTS
-- ============================================================================
SELECT 
  '=== UNIQUE CONSTRAINTS ===' as section,
  tc.table_name,
  tc.constraint_name,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'UNIQUE'
ORDER BY tc.table_name, tc.constraint_name;

-- 1️⃣2️⃣ CHECK CONSTRAINTS
-- ============================================================================
SELECT 
  '=== CHECK CONSTRAINTS ===' as section,
  tc.table_name,
  tc.constraint_name,
  cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc
  ON tc.constraint_name = cc.constraint_name
WHERE tc.table_schema = 'public'
  AND tc.constraint_type = 'CHECK'
ORDER BY tc.table_name;

-- 1️⃣3️⃣ DEFAULT VALUES PÅ KOLUMNER
-- ============================================================================
SELECT 
  '=== DEFAULT VALUES ===' as section,
  table_name,
  column_name,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_default IS NOT NULL
ORDER BY table_name, ordinal_position;

-- 1️⃣4️⃣ VIEWS (om du har några)
-- ============================================================================
SELECT 
  '=== VIEWS ===' as section,
  v.table_name as view_name,
  v.view_definition
FROM information_schema.views v
WHERE v.table_schema = 'public'
ORDER BY v.table_name;

-- 1️⃣5️⃣ MATERIALIZED VIEWS (om du har några)
-- ============================================================================
SELECT 
  '=== MATERIALIZED VIEWS ===' as section,
  mv.schemaname,
  mv.matviewname,
  mv.definition
FROM pg_matviews mv
WHERE mv.schemaname = 'public'
ORDER BY mv.matviewname;

-- 1️⃣6️⃣ ALLA TABELLER MED ANTAL RADER (för att förstå data-storlek)
-- ============================================================================
SELECT 
  '=== TABLE ROW COUNTS ===' as section,
  stat.schemaname,
  stat.relname as tablename,
  stat.n_live_tup as row_count,
  pg_size_pretty(pg_total_relation_size(stat.schemaname||'.'||stat.relname)) as total_size
FROM pg_stat_user_tables stat
WHERE stat.schemaname = 'public'
ORDER BY stat.n_live_tup DESC;

-- ============================================================================
-- KLART! Kopiera HELA outputen och skicka till AI-assistenten
-- ============================================================================
