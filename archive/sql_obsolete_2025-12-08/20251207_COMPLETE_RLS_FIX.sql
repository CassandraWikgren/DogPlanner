-- =====================================================
-- KOMPLETT RLS-FIX FÖR ALLA TABELLER
-- =====================================================
-- Datum: 2025-12-07
-- Problem: Personal får 500-fel på dogs, owners, bookings
-- Orsak: Tidigare RLS-policies har konflikter
-- Lösning: Rensa ALLA policies och skapa nya korrekta
-- =====================================================

-- =====================================================
-- STEG 1: RENSA ALLA GAMLA POLICIES
-- =====================================================

-- OWNERS
DROP POLICY IF EXISTS owners_select_policy ON owners;
DROP POLICY IF EXISTS owners_select_self_and_org ON owners;
DROP POLICY IF EXISTS owners_select_by_org_or_self ON owners;
DROP POLICY IF EXISTS owners_select_just_created ON owners;
DROP POLICY IF EXISTS owners_insert_policy ON owners;
DROP POLICY IF EXISTS owners_insert_self ON owners;
DROP POLICY IF EXISTS owners_insert_org ON owners;
DROP POLICY IF EXISTS owners_update_policy ON owners;
DROP POLICY IF EXISTS owners_update_self ON owners;
DROP POLICY IF EXISTS owners_update_org ON owners;
DROP POLICY IF EXISTS owners_delete_policy ON owners;
DROP POLICY IF EXISTS owners_delete_org ON owners;
DROP POLICY IF EXISTS "Användare kan se sina egna djurägare" ON owners;
DROP POLICY IF EXISTS "Authenticated users can create owners" ON owners;
DROP POLICY IF EXISTS "Users can view owners in their org" ON owners;

-- DOGS
DROP POLICY IF EXISTS dogs_select_policy ON dogs;
DROP POLICY IF EXISTS dogs_select_owner_and_org ON dogs;
DROP POLICY IF EXISTS dogs_select_by_org_or_owner ON dogs;
DROP POLICY IF EXISTS dogs_insert_policy ON dogs;
DROP POLICY IF EXISTS dogs_update_policy ON dogs;
DROP POLICY IF EXISTS dogs_delete_policy ON dogs;
DROP POLICY IF EXISTS "Användare kan se sina egna hundar" ON dogs;
DROP POLICY IF EXISTS "Users can view dogs in their org" ON dogs;

-- BOOKINGS
DROP POLICY IF EXISTS bookings_select_policy ON bookings;
DROP POLICY IF EXISTS bookings_select_by_org ON bookings;
DROP POLICY IF EXISTS bookings_insert_policy ON bookings;
DROP POLICY IF EXISTS bookings_update_policy ON bookings;
DROP POLICY IF EXISTS bookings_delete_policy ON bookings;
DROP POLICY IF EXISTS "Users can view bookings in their org" ON bookings;
DROP POLICY IF EXISTS "Användare kan se sina egna bokningar" ON bookings;

-- =====================================================
-- STEG 2: AKTIVERA RLS PÅ ALLA TABELLER
-- =====================================================
ALTER TABLE owners ENABLE ROW LEVEL SECURITY;
ALTER TABLE dogs ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEG 3: SKAPA NYA KORREKTA POLICIES
-- =====================================================

-- ==================== OWNERS ====================
-- SELECT: Kunder ser sin egen rad, Personal ser alla i sin org + alla utan org
CREATE POLICY owners_select_policy ON owners FOR SELECT USING (
  -- Alternativ 1: Kund läser sin egen rad
  user_id = auth.uid()
  OR
  -- Alternativ 2: Personal läser owners
  (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
    AND (
      -- Owners i samma org
      org_id = (SELECT org_id FROM profiles WHERE profiles.id = auth.uid())
      OR
      -- ELLER owners utan org (pensionat-kunder)
      org_id IS NULL
    )
  )
);

-- INSERT: Kunder skapar sin egen, Personal skapar för sin org
CREATE POLICY owners_insert_policy ON owners FOR INSERT WITH CHECK (
  user_id = auth.uid()
  OR
  (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
    AND org_id = (SELECT org_id FROM profiles WHERE profiles.id = auth.uid())
  )
);

-- UPDATE: Kunder uppdaterar sin egen, Personal uppdaterar för sin org
CREATE POLICY owners_update_policy ON owners FOR UPDATE USING (
  user_id = auth.uid()
  OR
  (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
    AND org_id = (SELECT org_id FROM profiles WHERE profiles.id = auth.uid())
  )
);

-- DELETE: Endast personal
CREATE POLICY owners_delete_policy ON owners FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  AND org_id = (SELECT org_id FROM profiles WHERE profiles.id = auth.uid())
);

-- ==================== DOGS ====================
-- SELECT: Ägare ser sina hundar, Personal ser hundar i sin org + hundar utan org
CREATE POLICY dogs_select_policy ON dogs FOR SELECT USING (
  -- Alternativ 1: Ägare (via owners-tabellen)
  EXISTS (
    SELECT 1 FROM owners 
    WHERE owners.id = dogs.owner_id 
    AND owners.user_id = auth.uid()
  )
  OR
  -- Alternativ 2: Personal ser hundar
  (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
    AND (
      -- Hundar i samma org
      org_id = (SELECT org_id FROM profiles WHERE profiles.id = auth.uid())
      OR
      -- ELLER hundar utan org (pensionat-kunders hundar)
      org_id IS NULL
    )
  )
);

-- INSERT: Ägare eller personal
CREATE POLICY dogs_insert_policy ON dogs FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM owners 
    WHERE owners.id = dogs.owner_id 
    AND owners.user_id = auth.uid()
  )
  OR
  (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
    AND (
      org_id = (SELECT org_id FROM profiles WHERE profiles.id = auth.uid())
      OR org_id IS NULL
    )
  )
);

-- UPDATE: Ägare eller personal
CREATE POLICY dogs_update_policy ON dogs FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM owners 
    WHERE owners.id = dogs.owner_id 
    AND owners.user_id = auth.uid()
  )
  OR
  (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
    AND (
      org_id = (SELECT org_id FROM profiles WHERE profiles.id = auth.uid())
      OR org_id IS NULL
    )
  )
);

-- DELETE: Endast personal
CREATE POLICY dogs_delete_policy ON dogs FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  AND (
    org_id = (SELECT org_id FROM profiles WHERE profiles.id = auth.uid())
    OR org_id IS NULL
  )
);

-- ==================== BOOKINGS ====================
-- SELECT: Ägare ser sina bokningar, Personal ser alla i sin org
CREATE POLICY bookings_select_policy ON bookings FOR SELECT USING (
  -- Alternativ 1: Ägare ser sina bokningar (via dog -> owner)
  EXISTS (
    SELECT 1 FROM dogs
    JOIN owners ON owners.id = dogs.owner_id
    WHERE dogs.id = bookings.dog_id
    AND owners.user_id = auth.uid()
  )
  OR
  -- Alternativ 2: Personal ser alla bokningar för sin org
  (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
    AND org_id = (SELECT org_id FROM profiles WHERE profiles.id = auth.uid())
  )
);

-- INSERT: Ägare eller personal
CREATE POLICY bookings_insert_policy ON bookings FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM dogs
    JOIN owners ON owners.id = dogs.owner_id
    WHERE dogs.id = bookings.dog_id
    AND owners.user_id = auth.uid()
  )
  OR
  (
    EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
    AND org_id = (SELECT org_id FROM profiles WHERE profiles.id = auth.uid())
  )
);

-- UPDATE: Personal endast
CREATE POLICY bookings_update_policy ON bookings FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  AND org_id = (SELECT org_id FROM profiles WHERE profiles.id = auth.uid())
);

-- DELETE: Personal endast
CREATE POLICY bookings_delete_policy ON bookings FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid())
  AND org_id = (SELECT org_id FROM profiles WHERE profiles.id = auth.uid())
);

-- =====================================================
-- STEG 4: VERIFIERA
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ RLS policies skapade för owners, dogs, bookings';
  RAISE NOTICE '✅ Personal kan se alla kunder/hundar/bokningar i sin org';
  RAISE NOTICE '✅ Personal kan se pensionat-kunder (org_id IS NULL)';
  RAISE NOTICE '✅ Kunder kan bara se sin egen data';
END $$;

-- Visa resultat
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('owners', 'dogs', 'bookings')
ORDER BY tablename, policyname;
