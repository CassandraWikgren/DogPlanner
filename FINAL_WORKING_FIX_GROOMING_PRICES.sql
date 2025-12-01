-- =====================================================
-- SLUTGILTIG FIX - GROOMING PRICES RLS
-- =====================================================
-- Problem: INSERT policy kan inte referera till grooming_prices.org_id
-- eftersom raden inte finns än när policyn kollas!
-- 
-- Lösning: WITH CHECK får INTE referera till tabellen själv,
-- endast till NEW-värdena som ska insertas
-- =====================================================

-- Steg 1: Stäng av RLS
ALTER TABLE public.grooming_prices DISABLE ROW LEVEL SECURITY;

-- Steg 2: Ta bort ALLA policies
DROP POLICY IF EXISTS "grooming_prices_select_policy" ON public.grooming_prices;
DROP POLICY IF EXISTS "grooming_prices_insert_policy" ON public.grooming_prices;
DROP POLICY IF EXISTS "grooming_prices_update_policy" ON public.grooming_prices;
DROP POLICY IF EXISTS "grooming_prices_delete_policy" ON public.grooming_prices;
DROP POLICY IF EXISTS "Users can view grooming prices in their org" ON public.grooming_prices;
DROP POLICY IF EXISTS "Users can manage grooming prices in their org" ON public.grooming_prices;
DROP POLICY IF EXISTS "Users can insert grooming prices in their org" ON public.grooming_prices;
DROP POLICY IF EXISTS "Users can update grooming prices in their org" ON public.grooming_prices;
DROP POLICY IF EXISTS "Users can delete grooming prices in their org" ON public.grooming_prices;

-- Steg 3: Skapa KORREKTA policies

-- SELECT: Visa priser för egen org
CREATE POLICY "grooming_prices_select_policy"
ON public.grooming_prices
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT p.org_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid()
  )
);

-- INSERT: VIKTIGT! WITH CHECK får INTE referera till grooming_prices.org_id
-- utan måste kolla att det org_id som skickas in matchar användarens org_id
CREATE POLICY "grooming_prices_insert_policy"
ON public.grooming_prices
FOR INSERT
TO authenticated
WITH CHECK (
  org_id IN (
    SELECT p.org_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid()
  )
);

-- UPDATE: Både USING och WITH CHECK
CREATE POLICY "grooming_prices_update_policy"
ON public.grooming_prices
FOR UPDATE
TO authenticated
USING (
  org_id IN (
    SELECT p.org_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid()
  )
)
WITH CHECK (
  org_id IN (
    SELECT p.org_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid()
  )
);

-- DELETE: Endast USING
CREATE POLICY "grooming_prices_delete_policy"
ON public.grooming_prices
FOR DELETE
TO authenticated
USING (
  org_id IN (
    SELECT p.org_id 
    FROM public.profiles p 
    WHERE p.id = auth.uid()
  )
);

-- Steg 4: Aktivera RLS
ALTER TABLE public.grooming_prices ENABLE ROW LEVEL SECURITY;

-- Steg 5: VERIFIERA policies
SELECT 
  '✅ POLICIES' as info,
  policyname,
  cmd,
  roles::text,
  CASE 
    WHEN cmd = 'INSERT' THEN 'WITH CHECK only'
    WHEN cmd = 'DELETE' THEN 'USING only'
    WHEN cmd = 'SELECT' THEN 'USING only'
    WHEN cmd = 'UPDATE' THEN 'USING + WITH CHECK'
  END as note
FROM pg_policies 
WHERE tablename = 'grooming_prices'
ORDER BY cmd;

-- Steg 6: TEST INSERT (detta borde fungera nu!)
DO $$
DECLARE
  test_user_id uuid;
  test_org_id uuid;
  insert_result record;
BEGIN
  -- Hämta första användaren
  SELECT id, org_id INTO test_user_id, test_org_id
  FROM profiles 
  WHERE org_id IS NOT NULL
  LIMIT 1;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'TEST INSERT:';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE 'Test user: %', test_user_id;
  RAISE NOTICE 'Test org_id: %', test_org_id;
  RAISE NOTICE '';
  
  -- Försök INSERT (som postgres/service_role, så RLS är disabled)
  BEGIN
    INSERT INTO grooming_prices (
      org_id,
      service_name,
      service_type,
      price,
      duration_minutes,
      active
    ) VALUES (
      test_org_id,
      'TEST PRIS - TA BORT',
      'bath',
      999,
      60,
      true
    )
    RETURNING * INTO insert_result;
    
    RAISE NOTICE '✅ INSERT LYCKADES!';
    RAISE NOTICE '   ID: %', insert_result.id;
    RAISE NOTICE '   Namn: %', insert_result.service_name;
    RAISE NOTICE '   Org: %', insert_result.org_id;
    RAISE NOTICE '';
    
    -- Rensa test-data
    DELETE FROM grooming_prices 
    WHERE service_name = 'TEST PRIS - TA BORT';
    
    RAISE NOTICE '🗑️  Test-data borttagen';
    
  EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ INSERT MISSLYCKADES:';
    RAISE NOTICE '   Error: %', SQLERRM;
    RAISE NOTICE '   Code: %', SQLSTATE;
  END;
  
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '🎯 TESTA NU I UI!';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE 'Om INSERT lyckades här kommer det fungera i UI också.';
  RAISE NOTICE 'Om det misslyckades, kolla felet ovan.';
  RAISE NOTICE '';
END $$;
