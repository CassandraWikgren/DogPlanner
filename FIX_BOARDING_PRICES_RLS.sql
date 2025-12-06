-- =====================================================
-- FIX: RLS Policy för boarding_prices INSERT
-- Datum: 2025-12-06
-- Problem: "new row violates row-level security policy"
-- =====================================================

-- Kolla nuvarande policies
SELECT policyname, cmd, permissive, roles, qual, with_check
FROM pg_policies 
WHERE tablename = 'boarding_prices';

-- =====================================================
-- SKAPA INSERT POLICY
-- =====================================================

-- Ta bort eventuell existerande insert policy
DROP POLICY IF EXISTS "Users can insert boarding_prices for their org" ON boarding_prices;
DROP POLICY IF EXISTS "boarding_prices_insert" ON boarding_prices;
DROP POLICY IF EXISTS "insert_boarding_prices_in_org" ON boarding_prices;

-- Skapa ny INSERT policy
CREATE POLICY "Users can insert boarding_prices for their org"
ON boarding_prices
FOR INSERT
TO authenticated
WITH CHECK (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- =====================================================
-- VERIFIERA UPDATE POLICY OCKSÅ
-- =====================================================

DROP POLICY IF EXISTS "Users can update boarding_prices for their org" ON boarding_prices;

CREATE POLICY "Users can update boarding_prices for their org"
ON boarding_prices
FOR UPDATE
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

-- =====================================================
-- VERIFIERA SELECT POLICY
-- =====================================================

DROP POLICY IF EXISTS "Users can view boarding_prices for their org" ON boarding_prices;

CREATE POLICY "Users can view boarding_prices for their org"
ON boarding_prices
FOR SELECT
TO authenticated
USING (
  org_id IN (
    SELECT org_id FROM profiles WHERE id = auth.uid()
  )
);

-- =====================================================
-- SE TILL ATT RLS ÄR AKTIVERAT
-- =====================================================

ALTER TABLE boarding_prices ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- VERIFIERING
-- =====================================================

SELECT 'boarding_prices policies:' as info;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'boarding_prices';
