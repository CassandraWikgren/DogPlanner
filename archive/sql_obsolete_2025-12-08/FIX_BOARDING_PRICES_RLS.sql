-- =====================================================
-- FIX: RLS Policy för boarding_prices 
-- Datum: 2025-12-06
-- Problem: "new row violates row-level security policy"
-- 
-- Denna policy borde redan finnas från 20251203_COMPLETE_RLS_FIX.sql
-- men den har kanske inte körts i produktion.
-- =====================================================

-- 1. Kolla först vilka policies som finns
SELECT 'Nuvarande policies på boarding_prices:' as info;
SELECT policyname, cmd, permissive
FROM pg_policies 
WHERE tablename = 'boarding_prices';

-- 2. Återskapa policyn (ofarligt att köra igen)
DROP POLICY IF EXISTS "boarding_prices_org_all" ON public.boarding_prices;

CREATE POLICY "boarding_prices_org_all" 
  ON public.boarding_prices
  FOR ALL 
  TO authenticated
  USING (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  )
  WITH CHECK (
    org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

-- 3. Se till att RLS är aktiverat
ALTER TABLE boarding_prices ENABLE ROW LEVEL SECURITY;

-- 4. Verifiera
SELECT 'Efter fix - policies på boarding_prices:' as info;
SELECT policyname, cmd, permissive
FROM pg_policies 
WHERE tablename = 'boarding_prices';
