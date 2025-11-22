-- KRITISK FIX: RLS för owners, dogs och bookings måste tillåta både företag OCH hundägare
-- Problem: Nuvarande policies endast tillåter profiles.org_id match, men hundägare har ingen profile
-- Lösning: Tillåt access om ANTINGEN org_id matchar ELLER användaren är ägaren själv

-- =====================================================
-- 1. FIX OWNERS RLS
-- =====================================================

DROP POLICY IF EXISTS "owners_org_select" ON owners;
DROP POLICY IF EXISTS "owners_org_update" ON owners;

-- Företag kan se sina org-kopplade owners, hundägare kan se sin egen profil
CREATE POLICY "owners_select_by_org_or_self" ON owners 
FOR SELECT 
TO authenticated
USING (
  org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR
  id = auth.uid()
);

-- Företag kan uppdatera sina org owners, hundägare kan uppdatera sin egen profil
CREATE POLICY "owners_update_by_org_or_self" ON owners
FOR UPDATE
TO authenticated
USING (
  org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR
  id = auth.uid()
)
WITH CHECK (
  org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR
  id = auth.uid()
);

-- =====================================================
-- 2. FIX DOGS RLS
-- =====================================================

DROP POLICY IF EXISTS "dogs_org_select" ON dogs;
DROP POLICY IF EXISTS "dogs_org_update" ON dogs;

-- Företag kan se sina org-hundar, hundägare kan se sina egna hundar
CREATE POLICY "dogs_select_by_org_or_owner" ON dogs
FOR SELECT
TO authenticated
USING (
  org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR
  owner_id IN (SELECT id FROM owners WHERE id = auth.uid())
);

-- Företag kan uppdatera sina org-hundar, hundägare kan uppdatera sina egna hundar  
CREATE POLICY "dogs_update_by_org_or_owner" ON dogs
FOR UPDATE
TO authenticated
USING (
  org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR
  owner_id IN (SELECT id FROM owners WHERE id = auth.uid())
)
WITH CHECK (
  org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR
  owner_id IN (SELECT id FROM owners WHERE id = auth.uid())
);

-- =====================================================
-- 3. FIX BOOKINGS RLS
-- =====================================================

DROP POLICY IF EXISTS "bookings_org_select" ON bookings;
DROP POLICY IF EXISTS "bookings_org_update" ON bookings;

-- Företag kan se sina org-bookings, hundägare kan se sina egna bookings
CREATE POLICY "bookings_select_by_org_or_owner" ON bookings 
FOR SELECT 
TO authenticated
USING (
  org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR
  owner_id IN (SELECT id FROM owners WHERE id = auth.uid())
);

-- Företag kan uppdatera alla sina bookings, hundägare kan endast uppdatera pending bookings
CREATE POLICY "bookings_update_by_org_or_owner" ON bookings
FOR UPDATE
TO authenticated
USING (
  org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR
  (owner_id IN (SELECT id FROM owners WHERE id = auth.uid()) AND status = 'pending')
)
WITH CHECK (
  org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
  OR
  (owner_id IN (SELECT id FROM owners WHERE id = auth.uid()) AND status = 'pending')
);

-- DELETE policies kvarstår oförändrade (endast org members får radera)
