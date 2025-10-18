-- ==============================
-- KOMPLETT DATABASANALYS
-- Kör denna i Supabase SQL Editor för att se HELA din struktur
-- 
-- STATUS: ✅ ROOMS-TABELL SKAPAD OCH FUNKTIONELL
-- DATUM: 2024-12-19
-- ==============================

-- 1. ALLA TABELLER OCH DERAS KOLUMNER
SELECT 
    '=== TABELL: ' || t.table_name || ' ===' AS info,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default,
    c.ordinal_position
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- 2. ALLA FUNKTIONER
SELECT 
    '=== FUNKTION: ' || routine_name || ' ===' AS info,
    routine_definition
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- 3. ALLA TRIGGERS
SELECT 
    '=== TRIGGER: ' || trigger_name || ' på ' || event_object_table || ' ===' AS info,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

-- 4. ALLA FOREIGN KEYS
SELECT
    '=== FK: ' || kcu.table_name || '.' || kcu.column_name || ' -> ' || ccu.table_name || '.' || ccu.column_name || ' ===' AS info
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public'
ORDER BY kcu.table_name;

-- 5. RLS STATUS
SELECT 
    '=== RLS: ' || tablename || ' = ' || CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END || ' ===' AS info
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 6. ALLA POLICIES
SELECT
    '=== POLICY: ' || policyname || ' på ' || tablename || ' ===' AS info,
    cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 7. ALLA INDEX
SELECT
    '=== INDEX: ' || indexname || ' på ' || tablename || ' ===' AS info
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;