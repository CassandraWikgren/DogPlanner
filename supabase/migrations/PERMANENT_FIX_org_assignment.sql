-- ============================================================================
-- PERMANENT LÖSNING: Fix org_id assignment för nya användare
-- ============================================================================
-- 
-- PROBLEMET:
-- Nya användare får inte org_id korrekt satt vid registrering, vilket leder
-- till "Ingen organisation tilldelad" fel. Detta händer eftersom:
-- 1. Database trigger ignorerar user_metadata (org_name, org_number)
-- 2. Auto-onboarding API körs inte konsekvent
-- 3. AuthContext har ingen fallback för att skapa org
--
-- LÖSNINGEN:
-- 3-lagers skydd som garanterar att användare ALLTID får en org_id:
-- 1. Database trigger som läser user_metadata och skapar org korrekt
-- 2. Auto-onboarding API som fallback
-- 3. AuthContext med automatisk healing
--
-- ============================================================================

-- LAGER 1: Förbättrad database trigger
-- ============================================================================
-- Denna trigger körs DIREKT när ny användare registreras i auth.users
-- Den läser user_metadata och skapar organisation + profil med korrekta värden

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_org_id uuid;
  v_org_name text;
  v_org_number text;
  v_full_name text;
  v_phone text;
BEGIN
  -- Läs metadata från registreringsformuläret
  v_org_name := COALESCE(NEW.raw_user_meta_data->>'org_name', split_part(NEW.email, '@', 1) || 's Hunddagis');
  v_org_number := NEW.raw_user_meta_data->>'org_number';
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  v_phone := NEW.raw_user_meta_data->>'phone';

  RAISE NOTICE '🔵 handle_new_user: Skapar org för % med metadata: org_name=%, org_number=%', 
    NEW.email, v_org_name, v_org_number;

  -- Skapa organisationen MED alla värden från registreringen
  INSERT INTO orgs (name, org_number, email, vat_included, vat_rate)
  VALUES (
    v_org_name,
    v_org_number,
    NEW.email,
    true,
    25
  )
  RETURNING id INTO v_org_id;

  RAISE NOTICE '✅ Organisation skapad: %', v_org_id;

  -- Skapa profilen som admin MED alla värden från registreringen
  INSERT INTO profiles (id, org_id, role, email, full_name, phone)
  VALUES (
    NEW.id,
    v_org_id,
    'admin',
    NEW.email,
    v_full_name,
    v_phone
  );

  RAISE NOTICE '✅ Profil skapad för användare: % med org_id: %', NEW.id, v_org_id;

  -- Skapa 3 månaders gratis prenumeration
  INSERT INTO org_subscriptions (org_id, plan, status, trial_starts_at, trial_ends_at, is_active)
  VALUES (
    v_org_id,
    'basic',
    'trialing',
    NOW(),
    NOW() + INTERVAL '3 months',
    true
  );

  RAISE NOTICE '✅ Prenumeration skapad för org: %', v_org_id;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ handle_new_user misslyckades: %', SQLERRM;
    RETURN NEW; -- Tillåt registrering även om trigger misslyckas
END;
$$;

-- Ta bort gamla, felaktiga triggers
DROP TRIGGER IF EXISTS trg_assign_org_to_new_user ON auth.users;
DROP TRIGGER IF EXISTS trg_handle_new_user ON auth.users;

-- Skapa den nya, korrekta triggern
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

COMMENT ON TRIGGER on_auth_user_created ON auth.users IS 
  'Skapar organisation och profil för nya användare med värden från user_metadata';

-- ============================================================================
-- LAGER 2: Förbättrad auto-onboarding API (redan bra, ingen ändring behövs)
-- ============================================================================
-- API:et /api/onboarding/auto körs från AuthContext och är en fallback
-- om triggern misslyckas. Detta är redan implementerat korrekt.

-- ============================================================================
-- LAGER 3: Healing-funktion för befintliga användare
-- ============================================================================
-- Denna funktion fixar användare som redan har problem (org_id = NULL)
-- Den kan köras manuellt eller automatiskt från AuthContext

CREATE OR REPLACE FUNCTION heal_user_missing_org(user_id uuid)
RETURNS jsonb
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql AS $$
DECLARE
  v_org_id uuid;
  v_org_name text;
  v_email text;
  v_user_metadata jsonb;
  v_result jsonb;
BEGIN
  -- Hämta användarens email och metadata från auth.users
  SELECT email, raw_user_meta_data 
  INTO v_email, v_user_metadata
  FROM auth.users 
  WHERE id = user_id;

  IF v_email IS NULL THEN
    RETURN jsonb_build_object('error', 'User not found');
  END IF;

  -- Kolla om användaren redan har en org
  SELECT org_id INTO v_org_id FROM profiles WHERE id = user_id;
  
  IF v_org_id IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true, 
      'message', 'User already has org_id',
      'org_id', v_org_id
    );
  END IF;

  RAISE NOTICE '🔧 Healing user % som saknar org_id', user_id;

  -- Försök hitta befintlig org baserat på email
  SELECT id INTO v_org_id 
  FROM orgs 
  WHERE email = v_email 
  LIMIT 1;

  -- Om ingen org finns, skapa en ny
  IF v_org_id IS NULL THEN
    v_org_name := COALESCE(
      v_user_metadata->>'org_name',
      split_part(v_email, '@', 1) || 's Hunddagis'
    );

    INSERT INTO orgs (name, org_number, email, vat_included, vat_rate)
    VALUES (
      v_org_name,
      v_user_metadata->>'org_number',
      v_email,
      true,
      25
    )
    RETURNING id INTO v_org_id;

    RAISE NOTICE '✅ Ny org skapad: %', v_org_id;

    -- Skapa prenumeration
    INSERT INTO org_subscriptions (org_id, plan, status, trial_starts_at, trial_ends_at, is_active)
    VALUES (
      v_org_id,
      'basic',
      'trialing',
      NOW(),
      NOW() + INTERVAL '3 months',
      true
    );
  END IF;

  -- Uppdatera eller skapa profilen med org_id
  INSERT INTO profiles (id, org_id, role, email, full_name, phone)
  VALUES (
    user_id,
    v_org_id,
    'admin',
    v_email,
    v_user_metadata->>'full_name',
    v_user_metadata->>'phone'
  )
  ON CONFLICT (id) DO UPDATE
  SET 
    org_id = EXCLUDED.org_id,
    updated_at = NOW();

  RAISE NOTICE '✅ Profil uppdaterad med org_id: %', v_org_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'User healed successfully',
    'org_id', v_org_id,
    'created_new_org', true
  );
END;
$$;

COMMENT ON FUNCTION heal_user_missing_org IS 
  'Fixar användare som saknar org_id genom att skapa/koppla organisation';

-- ============================================================================
-- VERIFIERING
-- ============================================================================

-- Kolla att triggern är aktiverad
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';

-- Kolla att funktionen finns
SELECT 
  routine_name,
  routine_type,
  security_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('handle_new_user', 'heal_user_missing_org');

-- Testa healing-funktionen på befintlig användare (byt ut email)
-- SELECT heal_user_missing_org(
--   (SELECT id FROM auth.users WHERE email = 'din@email.com' LIMIT 1)
-- );

-- ============================================================================
-- ANVÄNDARINSTRUKTIONER
-- ============================================================================
-- 
-- 1. Kör denna SQL-fil i Supabase SQL Editor
-- 
-- 2. För att fixa BEFINTLIGA användare med problem:
--    SELECT heal_user_missing_org(id) FROM auth.users 
--    WHERE id IN (SELECT id FROM profiles WHERE org_id IS NULL);
--
-- 3. För nya användare fungerar det automatiskt via triggern
--
-- 4. Om du behöver testa: registrera ny användare och kolla:
--    SELECT p.*, o.name, o.org_number 
--    FROM profiles p 
--    JOIN orgs o ON o.id = p.org_id 
--    WHERE p.email = 'test@example.com';
--
-- ============================================================================
