-- =====================================================
-- FIX: owners RLS policy för kundportal-användare
-- =====================================================
-- Datum: 2025-12-07
-- Problem: Kunder får 500-fel när de försöker läsa owners-tabellen
-- Orsak: EXISTS-subquery i policyn kräver profiles-tabellen som kunder inte har
-- Lösning: Förenkla policyn - kunder kan läsa sin egen rad via user_id
-- =====================================================

-- Ta bort problematisk policy
DROP POLICY IF EXISTS owners_select_self_and_org ON owners;
DROP POLICY IF EXISTS owners_select_by_org_or_self ON owners;
DROP POLICY IF EXISTS owners_select_just_created ON owners;

-- Ny enkel policy: 
-- 1. Kunder kan läsa sin egen rad (user_id = auth.uid())
-- 2. Personal kan läsa alla owners (de har profil med org_id)
CREATE POLICY owners_select_policy ON owners
FOR SELECT USING (
  -- Kund läser sin egen rad
  user_id = auth.uid()
  OR
  -- Personal (har profil) kan läsa alla owners för sin org ELLER owners utan org (pensionat-kunder)
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND (
      owners.org_id = p.org_id  -- Owners som tillhör deras org
      OR owners.org_id IS NULL  -- Pensionat-kunder (har ingen org)
    )
  )
);

-- INSERT: Kunder kan skapa sin egen rad, personal kan skapa för sin org
DROP POLICY IF EXISTS owners_insert_policy ON owners;
DROP POLICY IF EXISTS owners_insert_self ON owners;
DROP POLICY IF EXISTS owners_insert_org ON owners;

CREATE POLICY owners_insert_policy ON owners
FOR INSERT WITH CHECK (
  -- Kund skapar sin egen rad
  user_id = auth.uid()
  OR
  -- Personal skapar för sin org
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND owners.org_id = p.org_id
  )
);

-- UPDATE: Kunder kan uppdatera sin egen rad, personal kan uppdatera för sin org
DROP POLICY IF EXISTS owners_update_policy ON owners;
DROP POLICY IF EXISTS owners_update_self ON owners;
DROP POLICY IF EXISTS owners_update_org ON owners;

CREATE POLICY owners_update_policy ON owners
FOR UPDATE USING (
  user_id = auth.uid()
  OR
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND owners.org_id = p.org_id
  )
);

-- DELETE: Endast personal kan ta bort
DROP POLICY IF EXISTS owners_delete_policy ON owners;
DROP POLICY IF EXISTS owners_delete_org ON owners;

CREATE POLICY owners_delete_policy ON owners
FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM profiles p 
    WHERE p.id = auth.uid() 
    AND owners.org_id = p.org_id
  )
);

-- Verifiera
DO $$
BEGIN
  RAISE NOTICE '✅ owners RLS policies uppdaterade - kunder kan nu läsa sin egen rad';
END $$;

-- Visa resultat
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'owners' ORDER BY policyname;
