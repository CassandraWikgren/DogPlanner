-- ============================================================
-- DEBUG: Kolla special_dates och boarding_seasons schema
-- ============================================================
-- Kör detta i Supabase SQL Editor för att se exakt vilka kolumner som finns
-- ============================================================

-- 1️⃣ Visa alla kolumner i special_dates
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'special_dates'
ORDER BY ordinal_position;

-- 2️⃣ Visa alla kolumner i boarding_seasons
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'boarding_seasons'
ORDER BY ordinal_position;

-- 3️⃣ Kolla RLS-status igen
SELECT 
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '❌ RLS PÅ' ELSE '✅ RLS AV' END as status
FROM pg_tables 
WHERE tablename IN ('special_dates', 'boarding_seasons');

-- 4️⃣ Visa exempel-data från special_dates (första 3 raderna)
SELECT * FROM special_dates LIMIT 3;

-- 5️⃣ Visa exempel-data från boarding_seasons
SELECT * FROM boarding_seasons LIMIT 3;
