-- ============================================================
-- DEFINITIVE FIX: Grant ALL permissions på rätt sätt
-- ============================================================
-- Problem: Tabellerna har bara postgres permissions, inte anon/authenticated
-- Lösning: Explicit GRANT ALL med RESET av befintliga permissions
-- ============================================================

-- 1️⃣ Revoke alla befintliga permissions (reset)
REVOKE ALL ON special_dates FROM PUBLIC;
REVOKE ALL ON boarding_seasons FROM PUBLIC;

-- 2️⃣ Grant ALLA permissions till ALLA roller
GRANT ALL PRIVILEGES ON special_dates TO anon;
GRANT ALL PRIVILEGES ON special_dates TO authenticated;
GRANT ALL PRIVILEGES ON special_dates TO service_role;
GRANT ALL PRIVILEGES ON special_dates TO postgres;

GRANT ALL PRIVILEGES ON boarding_seasons TO anon;
GRANT ALL PRIVILEGES ON boarding_seasons TO authenticated;
GRANT ALL PRIVILEGES ON boarding_seasons TO service_role;
GRANT ALL PRIVILEGES ON boarding_seasons TO postgres;

-- 3️⃣ Grant USAGE på schema (kritiskt för API access!)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- 4️⃣ Stäng av RLS (dubbelkolla)
ALTER TABLE public.special_dates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.boarding_seasons DISABLE ROW LEVEL SECURITY;

-- 5️⃣ Drop ALL policies (kan finnas kvar och blockera)
DROP POLICY IF EXISTS "Enable read access for all users" ON special_dates;
DROP POLICY IF EXISTS "Enable read access for all users" ON boarding_seasons;

-- 6️⃣ Force schema reload
NOTIFY pgrst, 'reload schema';
NOTIFY pgrst, 'reload config';

-- 7️⃣ Verifiera permissions (borde se anon, authenticated, service_role NU)
SELECT 
  grantee, 
  table_name,
  privilege_type
FROM information_schema.table_privileges
WHERE table_name IN ('special_dates', 'boarding_seasons')
  AND table_schema = 'public'
ORDER BY table_name, grantee, privilege_type;

-- ============================================================
-- FÖRVÄNTAT RESULTAT: Borde se FLERA rader för varje tabell med:
-- anon         | special_dates    | SELECT, INSERT, UPDATE, DELETE...
-- authenticated| special_dates    | SELECT, INSERT, UPDATE, DELETE...
-- service_role | special_dates    | SELECT, INSERT, UPDATE, DELETE...
-- (samma för boarding_seasons)
-- ============================================================
