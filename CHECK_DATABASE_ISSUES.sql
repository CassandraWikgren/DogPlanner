-- =====================================================
-- DIAGNOSTIK FÖR SENTRY-FEL
-- Kontrollerar de viktigaste felen som dyker upp
-- =====================================================

-- 1. KOLLA OM OWNERS-TABELLEN FINNS OCH ÄR ÅTKOMLIG
-- =====================================================
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'owners';

-- Kolla RLS policies på owners
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
WHERE tablename = 'owners';

-- 2. KOLLA OM BOARDING_SEASONS.PRICE_MULTIPLIER FINNS
-- =====================================================
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'boarding_seasons'
ORDER BY ordinal_position;

-- 3. KOLLA VILKA KOLUMNER SOM FAKTISKT FINNS I BOARDING_SEASONS
-- =====================================================
SELECT * FROM boarding_seasons LIMIT 1;

-- 4. KOLLA OM VI HAR PUBLIC.OWNER_DISCOUNTS TABELLEN
-- =====================================================
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE tablename = 'owner_discounts';

-- 5. LISTA ALLA TABELLER I PUBLIC SCHEMA
-- =====================================================
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- 6. KOLLA JWT-KONFIGURATION FÖR SUPABASE
-- =====================================================
SHOW app.settings.jwt_secret;
SHOW app.settings.jwt_exp;

-- 7. VERIFIERA ATT DET INTE FINNS FLERA GOTRUEUCLIENT INSTANSER
-- =====================================================
-- Detta är ett frontend-problem, men vi kan kolla auth-konfigurationen
SELECT 
    id,
    email,
    created_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;
