-- =========================================
-- FIX: Tillåt kunder att läsa pensionatspriser
-- Datum: 2025-12-07
-- Problem: Kunder får 406-fel när de försöker läsa boarding_prices
-- Orsak: RLS-policyn tillåter bara läsning för organisationsmedlemmar
-- Lösning: Lägg till public read-policy för aktiva priser
-- =========================================

-- 1. Kontrollera nuvarande policies
SELECT 'Nuvarande policies på boarding_prices:' as info;
SELECT policyname, cmd, roles, qual 
FROM pg_policies 
WHERE tablename = 'boarding_prices';

-- 2. Lägg till en policy som tillåter alla autentiserade användare att LÄSA priser
-- (Endast SELECT - inte INSERT/UPDATE/DELETE)
DO $$
BEGIN
  -- Ta bort om den redan finns
  DROP POLICY IF EXISTS "boarding_prices_public_read" ON public.boarding_prices;
  
  -- Skapa ny policy för public read
  CREATE POLICY "boarding_prices_public_read" 
    ON public.boarding_prices
    FOR SELECT
    TO authenticated
    USING (is_active = true);  -- Endast aktiva priser är läsbara
    
  RAISE NOTICE '✅ Policy boarding_prices_public_read skapad';
END $$;

-- 3. Gör samma för boarding_seasons (behövs också för prisberäkning)
DO $$
BEGIN
  DROP POLICY IF EXISTS "boarding_seasons_public_read" ON public.boarding_seasons;
  
  CREATE POLICY "boarding_seasons_public_read" 
    ON public.boarding_seasons
    FOR SELECT
    TO authenticated
    USING (is_active = true);
    
  RAISE NOTICE '✅ Policy boarding_seasons_public_read skapad';
END $$;

-- 4. Gör samma för special_dates (behövs också för prisberäkning)
DO $$
BEGIN
  DROP POLICY IF EXISTS "special_dates_public_read" ON public.special_dates;
  
  CREATE POLICY "special_dates_public_read" 
    ON public.special_dates
    FOR SELECT
    TO authenticated
    USING (true);  -- special_dates har ingen is_active kolumn
    
  RAISE NOTICE '✅ Policy special_dates_public_read skapad';
END $$;

-- 5. Extra services behöver också vara läsbara för kunder
DO $$
BEGIN
  DROP POLICY IF EXISTS "extra_services_public_read" ON public.extra_services;
  
  CREATE POLICY "extra_services_public_read" 
    ON public.extra_services
    FOR SELECT
    TO authenticated
    USING (is_active = true);
    
  RAISE NOTICE '✅ Policy extra_services_public_read skapad';
END $$;

-- 6. Verifiera nya policies
SELECT 'Efter fix - policies på boarding_prices:' as info;
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'boarding_prices';

SELECT 'Efter fix - policies på boarding_seasons:' as info;
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'boarding_seasons';

SELECT 'Efter fix - policies på special_dates:' as info;
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'special_dates';

SELECT 'Efter fix - policies på extra_services:' as info;
SELECT policyname, cmd, roles
FROM pg_policies 
WHERE tablename = 'extra_services';

-- =========================================
-- SAMMANFATTNING:
-- =========================================
-- Lagt till _public_read policies för:
-- - boarding_prices (endast aktiva)
-- - boarding_seasons (endast aktiva)  
-- - special_dates (alla)
-- - extra_services (endast aktiva)
--
-- Detta tillåter kunder att läsa priser när de
-- gör bokningar via kundportalen.
--
-- Organisationsmedlemmar kan fortfarande göra
-- INSERT/UPDATE/DELETE via _org_all policies.
-- =========================================
