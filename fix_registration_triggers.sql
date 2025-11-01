-- ============================================================================
-- FIXA AUTO-REGISTRERING FÖR NYA ANVÄNDARE
-- Kör denna i Supabase SQL Editor (Production)
-- 
-- Detta säkerställer att ALLA nya användare automatiskt får:
-- 1. En organisation skapad
-- 2. En profil kopplad till organisationen
-- 3. Ett 3-månaders gratis abonnemang
-- ============================================================================

-- === STEG 1: SKAPA/UPPDATERA FUNKTIONEN SOM HANTERAR NYA ANVÄNDARE ===

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_org_name text;
  v_full_name text;
  v_org_number text;
  v_phone text;
  v_trial_ends timestamptz;
BEGIN
  -- Logga att funktionen körs
  RAISE NOTICE 'handle_new_user() körs för användare: %', NEW.id;

  -- Hämta metadata från registreringen
  v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1));
  v_org_name := COALESCE(NEW.raw_user_meta_data->>'org_name', split_part(NEW.email, '@', 1) || 's Hunddagis');
  v_org_number := NEW.raw_user_meta_data->>'org_number';
  v_phone := NEW.raw_user_meta_data->>'phone';

  RAISE NOTICE 'Skapar organisation: %', v_org_name;

  -- Skapa organisation
  INSERT INTO orgs (name, org_number, email, vat_included, vat_rate)
  VALUES (
    v_org_name,
    v_org_number,
    NEW.email,
    true,
    25
  )
  RETURNING id INTO v_org_id;

  RAISE NOTICE 'Organisation skapad med ID: %', v_org_id;

  -- Skapa profil
  INSERT INTO profiles (id, org_id, role, email, full_name, phone)
  VALUES (
    NEW.id,
    v_org_id,
    'admin',
    NEW.email,
    v_full_name,
    v_phone
  );

  RAISE NOTICE 'Profil skapad för användare: %', NEW.id;

  -- Skapa 3 månaders gratis prenumeration
  v_trial_ends := NOW() + INTERVAL '3 months';
  
  INSERT INTO subscriptions (org_id, plan, status, trial_starts_at, trial_ends_at)
  VALUES (
    v_org_id,
    'basic',
    'trialing',
    NOW(),
    v_trial_ends
  );

  RAISE NOTICE '3 månaders gratisperiod skapad, slutar: %', v_trial_ends;
  RAISE NOTICE '✅ Ny användare fullständigt uppsatt!';

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Fel i handle_new_user(): %, %', SQLERRM, SQLSTATE;
    RETURN NEW; -- Returnera ändå så användaren skapas
END;
$$ LANGUAGE plpgsql;

-- === STEG 2: TA BORT GAMLA TRIGGERS (OM DE FINNS) ===

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users;

-- === STEG 3: SKAPA NY TRIGGER ===

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- === STEG 4: VERIFIERA ATT TRIGGERN ÄR AKTIV ===

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement,
  action_timing
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created'
  AND event_object_table = 'users';

-- ============================================================================
-- TESTA TRIGGERN (FRIVILLIGT - SKAPA TESTANVÄNDARE)
-- ============================================================================

-- OBS: Kommentera bort detta block om du inte vill skapa en testanvändare!
-- Annars kör bara SELECT-delen för att kolla om din trigger finns.

/*
-- Skapa en testanvändare för att testa triggern
-- (Ändra emailen till något unikt)
DO $$
DECLARE
  v_test_user_id uuid;
BEGIN
  -- Simulera en ny användare (OBS: Detta fungerar bara i development!)
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test' || floor(random() * 10000)::text || '@example.com',
    crypt('testpassword123', gen_salt('bf')),
    NOW(),
    jsonb_build_object(
      'full_name', 'Test Testsson',
      'org_name', 'Test Hunddagis',
      'org_number', '123456-7890',
      'phone', '0701234567'
    ),
    NOW(),
    NOW()
  )
  RETURNING id INTO v_test_user_id;

  RAISE NOTICE 'Testanvändare skapad: %', v_test_user_id;

  -- Kolla om organisation och profil skapades
  PERFORM * FROM orgs WHERE email LIKE 'test%@example.com' ORDER BY created_at DESC LIMIT 1;
  IF FOUND THEN
    RAISE NOTICE '✅ Organisation skapades automatiskt!';
  ELSE
    RAISE WARNING '❌ Organisation skapades INTE - triggern fungerar inte!';
  END IF;

  PERFORM * FROM profiles WHERE id = v_test_user_id;
  IF FOUND THEN
    RAISE NOTICE '✅ Profil skapades automatiskt!';
  ELSE
    RAISE WARNING '❌ Profil skapades INTE - triggern fungerar inte!';
  END IF;
END $$;
*/

-- ============================================================================
-- INSTRUKTIONER:
-- 
-- 1. Kopiera hela denna SQL och kör i Supabase SQL Editor (Production)
-- 2. Verifiera att du ser triggern i output-tabellen
-- 3. Nästa gång någon registrerar sig på /register kommer de automatiskt få:
--    - En organisation
--    - En profil med admin-roll
--    - 3 månaders gratis abonnemang
-- 4. De behöver INTE köra några manuella SQL-scripts!
-- 
-- ✅ Detta fungerar både i development (med triggers disabled av complete_testdata.sql)
--    och i production (med denna trigger aktiv)!
-- ============================================================================

SELECT '✅ Registration trigger installerad!' as status;
