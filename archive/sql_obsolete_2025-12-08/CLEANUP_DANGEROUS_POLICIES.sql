-- ============================================================
-- 🧹 CLEANUP: Ta bort farliga och redundanta RLS policies
-- ============================================================
-- Datum: 2025-12-02
-- Syfte: Ta bort osäkra PUBLIC policies och redundanta policies
-- KRITISKT: Dessa policies tillåter OBEGRÄNSAD åtkomst!
-- ============================================================

-- ============================================================
-- 1️⃣ GROOMING_PRICES - Ta bort PUBLIC policies
-- ============================================================

-- Dessa 4 policies tillåter VEM SOM HELST att läsa/skriva/radera priser!
DROP POLICY IF EXISTS "grooming_select" ON public.grooming_prices;
DROP POLICY IF EXISTS "grooming_insert" ON public.grooming_prices;
DROP POLICY IF EXISTS "grooming_update" ON public.grooming_prices;
DROP POLICY IF EXISTS "grooming_delete" ON public.grooming_prices;

-- ============================================================
-- 2️⃣ SPECIAL_DATES - Ta bort PUBLIC policy
-- ============================================================

-- Denna policy tillåter ALLA (även icke-inloggade) att göra ALLT!
DROP POLICY IF EXISTS "Enable all for authenticated users on special_dates" ON public.special_dates;

-- ============================================================
-- 3️⃣ BOARDING_SEASONS - Ta bort redundant policy
-- ============================================================

-- Denna policy är redundant eftersom de 4 specifika policies redan täcker allt
DROP POLICY IF EXISTS "Enable all for authenticated users on boarding_seasons" ON public.boarding_seasons;

-- ============================================================
-- 4️⃣ VERIFIERA ATT FARLIGA POLICIES ÄR BORTA
-- ============================================================

SELECT 
  tablename,
  policyname,
  roles,
  cmd as operation,
  CASE 
    WHEN 'public' = ANY(roles) THEN '🔴 OSÄKER - PUBLIC ACCESS!'
    WHEN policyname LIKE '%Enable all%' THEN '⚠️ REDUNDANT - Dubblering'
    ELSE '✅ OK'
  END as status
FROM pg_policies
WHERE tablename IN (
  'grooming_bookings', 
  'grooming_journal', 
  'grooming_prices',
  'boarding_seasons',
  'special_dates'
)
ORDER BY 
  CASE 
    WHEN 'public' = ANY(roles) THEN 1
    WHEN policyname LIKE '%Enable all%' THEN 2
    ELSE 3
  END,
  tablename, 
  policyname;

-- ============================================================
-- FÖRVÄNTAT RESULTAT EFTER CLEANUP:
-- 
-- grooming_bookings: 4 policies (SELECT, INSERT, UPDATE, DELETE) - authenticated
-- grooming_journal: 3 policies (SELECT, INSERT, UPDATE) - authenticated
-- grooming_prices: 4 policies (SELECT, INSERT, UPDATE, DELETE) - authenticated
-- boarding_seasons: 4 policies (SELECT, INSERT, UPDATE, DELETE) - authenticated
-- special_dates: 4 policies (SELECT, INSERT, UPDATE, DELETE) - authenticated
-- 
-- TOTALT: 19 policies, ALLA för authenticated users only
-- INGA policies med roles={public}!
-- ============================================================

-- ============================================================
-- 5️⃣ SÄKERHETSVERIFIERING
-- ============================================================

-- Detta borde returnera 0 rader (inga osäkra policies kvar):
SELECT 
  tablename,
  policyname,
  'SÄKERHETSHOT!' as alert
FROM pg_policies
WHERE tablename IN (
  'grooming_bookings', 
  'grooming_journal', 
  'grooming_prices',
  'boarding_seasons',
  'special_dates'
)
AND 'public' = ANY(roles);

-- Om queryn returnerar några rader: RADERA DESSA POLICIES OMEDELBART!
