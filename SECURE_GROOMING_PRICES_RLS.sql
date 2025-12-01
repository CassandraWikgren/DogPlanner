-- 🔐 FIX: Stäng grooming_prices RLS-policys med proper org-filtrering
-- Kör detta i Supabase SQL Editor

-- STEG 1: Ta bort de öppna policyerna (från ABSOLUTE_FINAL_FIX.sql)
DROP POLICY IF EXISTS "grooming_select" ON public.grooming_prices;
DROP POLICY IF EXISTS "grooming_insert" ON public.grooming_prices;
DROP POLICY IF EXISTS "grooming_update" ON public.grooming_prices;
DROP POLICY IF EXISTS "grooming_delete" ON public.grooming_prices;

-- STEG 2: Skapa säkra policys med org-filtrering
-- Användare kan bara se/redigera sin egen organisations priser

CREATE POLICY "grooming_select" 
ON public.grooming_prices
FOR SELECT 
TO public
USING (
  org_id IN (
    SELECT org_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "grooming_insert" 
ON public.grooming_prices
FOR INSERT 
TO public
WITH CHECK (
  org_id IN (
    SELECT org_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "grooming_update" 
ON public.grooming_prices
FOR UPDATE 
TO public
USING (
  org_id IN (
    SELECT org_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
)
WITH CHECK (
  org_id IN (
    SELECT org_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "grooming_delete" 
ON public.grooming_prices
FOR DELETE 
TO public
USING (
  org_id IN (
    SELECT org_id 
    FROM public.profiles 
    WHERE user_id = auth.uid()
  )
);

-- STEG 3: Verifiera att policyerna är korrekt skapade
SELECT 
    policyname,
    cmd as operation,
    qual as using_clause,
    with_check
FROM pg_policies
WHERE tablename = 'grooming_prices'
ORDER BY policyname;

-- Förväntat resultat: 4 policys med org-filtrering via profiles-tabell
