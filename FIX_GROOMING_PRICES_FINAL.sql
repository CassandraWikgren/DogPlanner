-- =====================================================
-- GROOMING PRICES - SLUTGILTIG FIX
-- =====================================================
-- Problem: "new row violates row-level security policy"
-- Detta script fixar RLS policies OCH lägger till debug
-- =====================================================

-- Steg 1: Diagnostik FÖRE fix
-- =====================================================
DO $$
DECLARE
  table_exists boolean;
  policy_count integer;
  rls_enabled boolean;
BEGIN
  -- Kolla om tabellen finns
  SELECT EXISTS(
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'grooming_prices'
  ) INTO table_exists;
  
  RAISE NOTICE '📊 DIAGNOSTIK FÖRE FIX:';
  RAISE NOTICE '  ├─ Tabell exists: %', table_exists;
  
  IF NOT table_exists THEN
    RAISE EXCEPTION '❌ KRITISKT: grooming_prices tabellen finns inte! Kör först: 20251125_create_grooming_prices.sql';
  END IF;
  
  -- Kolla antal policies
  SELECT COUNT(*) INTO policy_count
  FROM pg_policies 
  WHERE tablename = 'grooming_prices';
  
  RAISE NOTICE '  ├─ Antal RLS policies: %', policy_count;
  
  -- Kolla om RLS är aktivt
  SELECT relrowsecurity INTO rls_enabled
  FROM pg_class
  WHERE relname = 'grooming_prices';
  
  RAISE NOTICE '  └─ RLS enabled: %', rls_enabled;
  RAISE NOTICE '';
END $$;

-- =====================================================
-- Steg 2: Ta bort ALLA befintliga policies
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '🗑️  RENSAR GAMLA POLICIES:';
END $$;

DROP POLICY IF EXISTS "Users can view grooming prices in their org" ON public.grooming_prices;
DROP POLICY IF EXISTS "Users can manage grooming prices in their org" ON public.grooming_prices;
DROP POLICY IF EXISTS "Users can insert grooming prices in their org" ON public.grooming_prices;
DROP POLICY IF EXISTS "Users can update grooming prices in their org" ON public.grooming_prices;
DROP POLICY IF EXISTS "Users can delete grooming prices in their org" ON public.grooming_prices;

DO $$
BEGIN
  RAISE NOTICE '  └─ Alla gamla policies borttagna';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- Steg 3: Skapa KORREKTA policies
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✨ SKAPAR NYA POLICIES:';
END $$;

-- SELECT: Visa priser för användarens org
CREATE POLICY "Users can view grooming prices in their org"
ON public.grooming_prices
FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  )
);

DO $$
BEGIN
  RAISE NOTICE '  ├─ SELECT policy skapad';
END $$;

-- INSERT: Lägg till priser i användarens org
-- VIKTIGT: Enkel WITH CHECK som matchar org_id
CREATE POLICY "Users can insert grooming prices in their org"
ON public.grooming_prices
FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  )
);

DO $$
BEGIN
  RAISE NOTICE '  ├─ INSERT policy skapad';
END $$;

-- UPDATE: Uppdatera priser i användarens org
CREATE POLICY "Users can update grooming prices in their org"
ON public.grooming_prices
FOR UPDATE
USING (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  )
);

DO $$
BEGIN
  RAISE NOTICE '  ├─ UPDATE policy skapad';
END $$;

-- DELETE: Ta bort priser i användarens org
CREATE POLICY "Users can delete grooming prices in their org"
ON public.grooming_prices
FOR DELETE
USING (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  )
);

DO $$
BEGIN
  RAISE NOTICE '  └─ DELETE policy skapad';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- Steg 4: Säkerställ att RLS är aktiverat
-- =====================================================
ALTER TABLE public.grooming_prices ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  RAISE NOTICE '🔒 RLS aktiverat på grooming_prices';
  RAISE NOTICE '';
END $$;

-- =====================================================
-- Steg 5: Verifiera installation
-- =====================================================
DO $$
DECLARE
  policy_count integer;
  select_count integer;
  insert_count integer;
  update_count integer;
  delete_count integer;
BEGIN
  RAISE NOTICE '✅ VERIFIERING EFTER FIX:';
  
  -- Räkna policies per typ
  SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE tablename = 'grooming_prices';
  SELECT COUNT(*) INTO select_count FROM pg_policies WHERE tablename = 'grooming_prices' AND cmd = 'SELECT';
  SELECT COUNT(*) INTO insert_count FROM pg_policies WHERE tablename = 'grooming_prices' AND cmd = 'INSERT';
  SELECT COUNT(*) INTO update_count FROM pg_policies WHERE tablename = 'grooming_prices' AND cmd = 'UPDATE';
  SELECT COUNT(*) INTO delete_count FROM pg_policies WHERE tablename = 'grooming_prices' AND cmd = 'DELETE';
  
  RAISE NOTICE '  ├─ Totalt policies: % (förväntat: 4)', policy_count;
  RAISE NOTICE '  ├─ SELECT policies: % (förväntat: 1)', select_count;
  RAISE NOTICE '  ├─ INSERT policies: % (förväntat: 1)', insert_count;
  RAISE NOTICE '  ├─ UPDATE policies: % (förväntat: 1)', update_count;
  RAISE NOTICE '  └─ DELETE policies: % (förväntat: 1)', delete_count;
  RAISE NOTICE '';
  
  IF policy_count != 4 THEN
    RAISE WARNING '⚠️  Varning: Förväntat 4 policies, hittade %', policy_count;
  END IF;
  
  IF select_count != 1 OR insert_count != 1 OR update_count != 1 OR delete_count != 1 THEN
    RAISE WARNING '⚠️  Varning: Policy-fördelning är felaktig!';
  END IF;
END $$;

-- =====================================================
-- Steg 6: Lista alla policies (för manual verifiering)
-- =====================================================
SELECT 
  '📋 AKTIVA RLS POLICIES:' as info,
  '' as policyname,
  '' as cmd,
  '' as using_clause
UNION ALL
SELECT 
  '',
  policyname,
  cmd,
  LEFT(qual::text, 60) as using_clause
FROM pg_policies 
WHERE tablename = 'grooming_prices'
ORDER BY cmd, policyname;

-- =====================================================
-- SLUTRAPPORT
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '🎉 GROOMING_PRICES RLS FIX KOMPLETT!';
  RAISE NOTICE '═══════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '✅ Nästa steg:';
  RAISE NOTICE '   1. Testa i UI: Admin → Hundfrisör → Priser';
  RAISE NOTICE '   2. Klicka "Lägg till pris"';
  RAISE NOTICE '   3. Fyll i formulär och spara';
  RAISE NOTICE '   4. Öppna Console (F12) och kolla efter fel';
  RAISE NOTICE '';
  RAISE NOTICE '📚 Om problem kvarstår:';
  RAISE NOTICE '   - Läs GROOMING_PRICES_FIX_GUIDE.md';
  RAISE NOTICE '   - Kolla att currentOrgId finns i AuthContext';
  RAISE NOTICE '   - Verifiera att användarprofil har org_id';
  RAISE NOTICE '';
END $$;
