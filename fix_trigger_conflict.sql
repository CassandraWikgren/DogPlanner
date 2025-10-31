-- ============================================================================
-- FIX: Ta bort duplicerade triggers som skapar profiler
-- Problem: Två triggers försöker skapa profile samtidigt → konflikt
-- Lösning: Behåll bara handle_new_user() som skapar NY org vid registrering
-- ============================================================================

-- Ta bort den gamla triggern som försöker matcha till befintlig org
DROP TRIGGER IF EXISTS trg_assign_org_to_new_user ON auth.users;

-- Ta bort funktionen också (den används inte längre)
DROP FUNCTION IF EXISTS assign_org_to_new_user();

-- Uppdatera handle_new_user() så den använder org_name och org_number från registreringsformuläret
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_org_id uuid;
  v_org_name text;
  v_org_number text;
BEGIN
  -- Hämta org_name och org_number från user_metadata (från registreringsformuläret)
  v_org_name := COALESCE(NEW.raw_user_meta_data->>'org_name', split_part(NEW.email, '@', 1) || 's Hunddagis');
  v_org_number := NEW.raw_user_meta_data->>'org_number';
  
  -- Skapa ny organisation
  INSERT INTO orgs (name, org_number, email) 
  VALUES (v_org_name, v_org_number, NEW.email)
  RETURNING id INTO v_org_id;
  
  -- Skapa profil som admin
  INSERT INTO profiles (id, org_id, role, email, full_name, phone)
  VALUES (
    NEW.id, 
    v_org_id, 
    'admin', 
    NEW.email, 
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'phone'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verifiera att bara handle_new_user trigger finns kvar:
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users' 
  AND event_object_schema = 'auth'
  AND trigger_name LIKE '%user%';

-- ============================================================================
-- KLART! Nu skapas en NY organisation för varje registrering
-- Användaren blir automatiskt admin av sin egen organisation
-- Nu kan du köra create_cassandra_user.sql utan konflikter
-- ============================================================================
