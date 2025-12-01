-- =====================================================
-- ULTIMATE FIX FÖR GROOMING_PRICES
-- =====================================================
-- Detta script fixar RLS policies GARANTERAT
-- Kör som postgres/service_role användare i Supabase
-- =====================================================

-- Steg 1: Stäng av RLS temporärt för att rensa
ALTER TABLE public.grooming_prices DISABLE ROW LEVEL SECURITY;

-- Steg 2: Ta bort ALLA befintliga policies (om några finns)
DROP POLICY IF EXISTS "Users can view grooming prices in their org" ON public.grooming_prices;
DROP POLICY IF EXISTS "Users can manage grooming prices in their org" ON public.grooming_prices;
DROP POLICY IF EXISTS "Users can insert grooming prices in their org" ON public.grooming_prices;
DROP POLICY IF EXISTS "Users can update grooming prices in their org" ON public.grooming_prices;
DROP POLICY IF EXISTS "Users can delete grooming prices in their org" ON public.grooming_prices;
DROP POLICY IF EXISTS "Enable read access for org members" ON public.grooming_prices;
DROP POLICY IF EXISTS "Enable insert for org members" ON public.grooming_prices;
DROP POLICY IF EXISTS "Enable update for org members" ON public.grooming_prices;
DROP POLICY IF EXISTS "Enable delete for org members" ON public.grooming_prices;

-- Steg 3: Skapa NYA policies med ENKLASTE möjliga syntax
-- Dessa policies använder DIREKT jämförelse, inte IN subquery

-- SELECT: Läs priser i egen org
CREATE POLICY "grooming_prices_select_policy"
ON public.grooming_prices
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.org_id = grooming_prices.org_id
  )
);

-- INSERT: Lägg till priser i egen org
CREATE POLICY "grooming_prices_insert_policy"
ON public.grooming_prices
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.org_id = grooming_prices.org_id
  )
);

-- UPDATE: Uppdatera priser i egen org
CREATE POLICY "grooming_prices_update_policy"
ON public.grooming_prices
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.org_id = grooming_prices.org_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.org_id = grooming_prices.org_id
  )
);

-- DELETE: Ta bort priser i egen org
CREATE POLICY "grooming_prices_delete_policy"
ON public.grooming_prices
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.id = auth.uid()
    AND profiles.org_id = grooming_prices.org_id
  )
);

-- Steg 4: Aktivera RLS igen
ALTER TABLE public.grooming_prices ENABLE ROW LEVEL SECURITY;

-- Steg 5: Verifiera
SELECT 
  '✅ VERIFIERING' as status,
  COUNT(*) as antal_policies
FROM pg_policies 
WHERE tablename = 'grooming_prices';

SELECT 
  '📋 POLICIES' as info,
  policyname,
  cmd,
  roles::text
FROM pg_policies 
WHERE tablename = 'grooming_prices'
ORDER BY cmd;

-- Bekräftelse
DO $$
BEGIN
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '🎉 GROOMING_PRICES RLS FIX KLAR!';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ 4 policies skapade:';
  RAISE NOTICE '   - grooming_prices_select_policy (SELECT)';
  RAISE NOTICE '   - grooming_prices_insert_policy (INSERT)';
  RAISE NOTICE '   - grooming_prices_update_policy (UPDATE)';
  RAISE NOTICE '   - grooming_prices_delete_policy (DELETE)';
  RAISE NOTICE '';
  RAISE NOTICE '🔒 RLS är aktiverat';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 Testa nu i UI: Admin → Hundfrisör → Priser';
  RAISE NOTICE '';
END $$;
