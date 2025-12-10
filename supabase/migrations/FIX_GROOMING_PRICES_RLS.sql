-- =====================================================
-- FIX: grooming_prices RLS Policy
-- =====================================================
-- Problem: "new row violates row-level security policy"
-- Orsak: FOR ALL policy använder subquery i både USING och WITH CHECK
-- Lösning: Separera policies för INSERT, UPDATE, DELETE med enklare checks

-- Ta bort gamla policies
DROP POLICY IF EXISTS "Users can view grooming prices in their org" ON public.grooming_prices;
DROP POLICY IF EXISTS "Users can manage grooming prices in their org" ON public.grooming_prices;

-- SELECT: Visa priser för användarens org
CREATE POLICY "Users can view grooming prices in their org"
ON public.grooming_prices
FOR SELECT
USING (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- INSERT: Lägg till priser i användarens org
CREATE POLICY "Users can insert grooming prices in their org"
ON public.grooming_prices
FOR INSERT
WITH CHECK (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  )
);

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

-- DELETE: Ta bort priser i användarens org
CREATE POLICY "Users can delete grooming prices in their org"
ON public.grooming_prices
FOR DELETE
USING (
  org_id IN (
    SELECT org_id FROM public.profiles WHERE id = auth.uid()
  )
);

-- Verifiera
DO $$
BEGIN
    RAISE NOTICE '✅ grooming_prices RLS policies uppdaterade med separata INSERT/UPDATE/DELETE policies';
END $$;
