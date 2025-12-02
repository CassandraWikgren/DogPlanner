-- ============================================================
-- DEBUG: Pensionat-tabeller saknade kolumner
-- ============================================================
-- Fel 1: special_dates - 406 error
-- Fel 2: boarding_seasons.is_active does not exist
-- ============================================================

-- 1️⃣ Kontrollera att tabellerna finns
SELECT 
  tablename,
  schemaname,
  tableowner
FROM pg_tables 
WHERE tablename IN ('special_dates', 'boarding_seasons')
ORDER BY tablename;

-- Förväntat: 2 rader


-- 2️⃣ Kolla kolumner i boarding_seasons
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'boarding_seasons'
ORDER BY ordinal_position;

-- Leta efter: finns is_active?


-- 3️⃣ Kolla kolumner i special_dates (om tabellen finns)
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'special_dates'
ORDER BY ordinal_position;


-- 4️⃣ Kolla RLS status
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename IN ('special_dates', 'boarding_seasons')
ORDER BY tablename;


-- 5️⃣ Räkna data (om RLS tillåter)
SELECT 
  (SELECT COUNT(*) FROM special_dates) as special_dates_count,
  (SELECT COUNT(*) FROM boarding_seasons) as boarding_seasons_count;
