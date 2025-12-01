-- ============================================
-- KOMPLETT SCHEMA-EXPORT FÖR DOGPLANNER
-- ============================================
-- Kör dessa queries i Supabase SQL Editor och spara resultatet
-- Uppdatera sedan detta repo så AI:n har färsk information
--
-- Körordning:
-- 1. Kör varje query nedan (separat)
-- 2. Kopiera JSON-resultatet
-- 3. Klistra in i detta repo och säg till AI:n
-- ============================================

-- ============================================
-- QUERY 1: ALLA TABELLER OCH KOLUMNER
-- ============================================
-- Denna query ger komplett översikt av alla tabeller, kolumner, datatyper och constraints
SELECT json_agg(
  json_build_object(
    'table_name', table_name,
    'column_name', column_name,
    'data_type', data_type,
    'column_default', column_default,
    'is_nullable', is_nullable
  )
  ORDER BY table_name, ordinal_position
)
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name NOT IN ('schema_migrations', 'ar_internal_metadata');


-- ============================================
-- QUERY 2: ALLA TRIGGERS OCH FUNCTIONS
-- ============================================
-- Denna query visar vilka triggers som finns och vad de gör
SELECT json_agg(
  json_build_object(
    'trigger_name', t.tgname,
    'table_name', c.relname,
    'function_name', p.proname,
    'trigger_definition', pg_get_triggerdef(t.oid),
    'function_definition', pg_get_functiondef(t.tgfoid)
  )
  ORDER BY c.relname, t.tgname
)
FROM pg_trigger t
JOIN pg_class c ON c.oid = t.tgrelid
JOIN pg_proc p ON p.oid = t.tgfoid
WHERE NOT t.tgisinternal
  AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');


-- ============================================
-- QUERY 3: ALLA RLS POLICIES
-- ============================================
-- Denna query visar Row Level Security policies (viktigt för multi-tenancy)
SELECT json_agg(
  json_build_object(
    'schemaname', schemaname,
    'tablename', tablename,
    'policyname', policyname,
    'permissive', permissive,
    'roles', roles,
    'cmd', cmd,
    'qual', qual,
    'with_check', with_check
  )
  ORDER BY schemaname, tablename, policyname
)
FROM pg_policies
WHERE schemaname = 'public';


-- ============================================
-- QUERY 4: ALLA FOREIGN KEYS
-- ============================================
-- Denna query visar relationer mellan tabeller
SELECT json_agg(
  json_build_object(
    'constraint_name', tc.constraint_name,
    'table_name', tc.table_name,
    'column_name', kcu.column_name,
    'foreign_table_name', ccu.table_name,
    'foreign_column_name', ccu.column_name
  )
  ORDER BY tc.table_name, tc.constraint_name
)
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public';


-- ============================================
-- QUERY 5: ALLA INDEXES
-- ============================================
-- Denna query visar vilka index som finns (viktigt för performance)
SELECT json_agg(
  json_build_object(
    'table_name', tablename,
    'index_name', indexname,
    'index_definition', indexdef
  )
  ORDER BY tablename, indexname
)
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename NOT IN ('schema_migrations', 'ar_internal_metadata');


-- ============================================
-- QUERY 6: ALLA VIEWS
-- ============================================
-- Denna query visar alla views (färdiga queries som används som tabeller)
SELECT json_agg(
  json_build_object(
    'view_name', table_name,
    'view_definition', view_definition
  )
  ORDER BY table_name
)
FROM information_schema.views
WHERE table_schema = 'public';


-- ============================================
-- QUERY 7: ALLA RPC FUNCTIONS (CALLABLE FROM APP)
-- ============================================
-- Dessa är funktioner du kan anropa från frontend
SELECT json_agg(
  json_build_object(
    'function_name', p.proname,
    'return_type', pg_get_function_result(p.oid),
    'arguments', pg_get_function_arguments(p.oid),
    'function_definition', pg_get_functiondef(p.oid)
  )
  ORDER BY p.proname
)
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
  AND p.prokind = 'f'  -- Only functions, not procedures or aggregates
  AND p.proname NOT LIKE 'pg_%'
  AND p.proname NOT LIKE 'pgsodium_%';


-- ============================================
-- INSTRUKTIONER
-- ============================================
--
-- Så här använder du denna fil:
--
-- 1. Öppna Supabase SQL Editor
-- 2. Kopiera och kör QUERY 1 → Spara resultatet som "tables_columns.json"
-- 3. Kopiera och kör QUERY 2 → Spara resultatet som "triggers_functions.json"
-- 4. Kopiera och kör QUERY 3 → Spara resultatet som "rls_policies.json"
-- 5. Kopiera och kör QUERY 4 → Spara resultatet som "foreign_keys.json"
-- 6. Kopiera och kör QUERY 5 → Spara resultatet som "indexes.json"
-- 7. Kopiera och kör QUERY 6 → Spara resultatet som "views.json"
-- 8. Kopiera och kör QUERY 7 → Spara resultatet som "rpc_functions.json"
--
-- 9. Skicka alla JSON-resultat till AI:n och säg:
--    "Här är uppdaterat schema från Supabase"
--
-- Alternativt: Klistra in direkt i chatten utan att spara filer.
--
-- ============================================
-- KORTVERSION (om du vill ha allt på en gång)
-- ============================================
-- Om du bara vill köra EN query som ger grundläggande info:
--
SELECT json_agg(
  json_build_object(
    'table_name', table_name,
    'column_name', column_name,
    'data_type', data_type,
    'column_default', column_default,
    'is_nullable', is_nullable
  )
  ORDER BY table_name, ordinal_position
)
FROM information_schema.columns
WHERE table_schema = 'public';
--
-- Detta är minimum jag behöver för att förstå din databas!
-- ============================================
