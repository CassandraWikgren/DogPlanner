-- Komplett rapport över alla tabeller, RLS-status och policys
-- Kör detta i Supabase SQL Editor för att få full översikt

-- 1. Alla tabeller med RLS-status
SELECT 
    schemaname,
    tablename,
    rowsecurity as "RLS Enabled"
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 2. Alla aktiva RLS-policys
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd as "Operation (SELECT/INSERT/UPDATE/DELETE)",
    qual as "USING clause",
    with_check as "WITH CHECK clause"
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 3. Tabeller med RLS enabled MEN inga policys (PROBLEM!)
SELECT 
    t.tablename,
    'RLS enabled but NO policies!' as status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
    AND t.rowsecurity = true
    AND p.policyname IS NULL
GROUP BY t.tablename;

-- 4. Tabeller utan RLS (potentiellt osäkra)
SELECT 
    tablename,
    'RLS disabled - potentially insecure' as status
FROM pg_tables 
WHERE schemaname = 'public'
    AND rowsecurity = false
ORDER BY tablename;

-- 5. Verifiera grooming_prices har OPEN policies (från ABSOLUTE_FINAL_FIX.sql)
SELECT 
    policyname,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'grooming_prices'
ORDER BY policyname;
