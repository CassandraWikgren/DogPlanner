-- ==============================
-- SCHEMA EXPORT SCRIPT
-- Kör denna i Supabase SQL Editor för att få current schema
-- ==============================

-- 1. Visa alla tabeller och deras kolumner
SELECT 
    t.table_name,
    c.column_name,
    c.data_type,
    c.is_nullable,
    c.column_default
FROM information_schema.tables t
JOIN information_schema.columns c ON t.table_name = c.table_name
WHERE t.table_schema = 'public'
AND t.table_type = 'BASE TABLE'
ORDER BY t.table_name, c.ordinal_position;

-- 2. Visa alla foreign keys
SELECT
    kcu.table_name AS foreign_table,
    kcu.column_name AS foreign_column,
    ccu.table_name AS primary_table,
    ccu.column_name AS primary_column
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_schema = 'public';

-- 3. Visa alla triggers
SELECT 
    trigger_name,
    trigger_schema,
    event_object_table AS table_name,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;

-- 4. Visa RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;