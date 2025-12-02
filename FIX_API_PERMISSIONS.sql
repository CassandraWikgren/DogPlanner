-- ============================================================
-- FIX: Enable PostgREST API för special_dates och boarding_seasons
-- ============================================================
-- 406-fel betyder att tabellerna inte är exponerade via REST API
-- Detta fixar det genom att explicit ge API access
-- ============================================================

-- 1️⃣ Kolla om tabellerna är i public schema (måste vara för API access)
SELECT 
  table_schema,
  table_name
FROM information_schema.tables
WHERE table_name IN ('special_dates', 'boarding_seasons');

-- 2️⃣ Grant permissions till anon role (PostgREST API)
GRANT SELECT ON public.special_dates TO anon;
GRANT SELECT ON public.special_dates TO authenticated;

GRANT SELECT ON public.boarding_seasons TO anon;
GRANT SELECT ON public.boarding_seasons TO authenticated;

-- 3️⃣ Grant USAGE på schema (behövs för API access)
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 4️⃣ Stäng av RLS igen (dubbelkolla)
ALTER TABLE public.special_dates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.boarding_seasons DISABLE ROW LEVEL SECURITY;

-- 5️⃣ Verifiera permissions
SELECT 
  table_name,
  privilege_type,
  grantee
FROM information_schema.table_privileges
WHERE table_name IN ('special_dates', 'boarding_seasons')
  AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- ============================================================
-- FÖRVÄNTAT RESULTAT:
-- special_dates    | SELECT | anon
-- special_dates    | SELECT | authenticated
-- boarding_seasons | SELECT | anon
-- boarding_seasons | SELECT | authenticated
-- ============================================================
