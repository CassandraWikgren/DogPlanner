-- ============================================================================
-- SÄKER VERSION: Fix org_id assignment (ENDAST funktioner, inga triggers)
-- ============================================================================
-- Denna version uppdaterar BARA funktionerna, inte triggers
-- Triggern on_auth_user_created finns redan i din databas från schema.sql
-- Vi behöver bara se till att funktionen är uppdaterad
-- ============================================================================

-- STEG 1: Uppdatera handle_new_user() funktionen
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
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
  INSERT INTO public.orgs (name, org_number, email, vat_included, vat_rate)
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
  INSERT INTO public.profiles (id, org_id, role, email, full_name, phone)
  VALUES (
    NEW.id,
    v_org_id,
    'admin',
    NEW.email,
    v_full_name,
    v_phone
  );

  RAISE NOTICE '✅ Profil skapad för användare: % med org_id: %', NEW.id, v_org_id;

  -- Skapa 3 månaders gratis prenumeration (om tabellen finns)
  BEGIN
    INSERT INTO public.org_subscriptions (org_id, plan, status, trial_starts_at, trial_ends_at, is_active)
    VALUES (
      v_org_id,
      'basic',
      'trialing',
      NOW(),
      NOW() + INTERVAL '3 months',
      true
    );
    RAISE NOTICE '✅ Prenumeration skapad för org: %', v_org_id;
  EXCEPTION
    WHEN undefined_table THEN
      RAISE NOTICE '⚠️ org_subscriptions tabell finns inte, skippar prenumeration';
  END;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '❌ handle_new_user misslyckades: %', SQLERRM;
    RETURN NEW; -- Tillåt registrering även om trigger misslyckas
END;
$$;

COMMENT ON FUNCTION public.handle_new_user IS 
  'Skapar organisation och profil för nya användare med värden från user_metadata';

-- ============================================================================
-- STEG 2: Skapa healing-funktionen
-- ============================================================================
CREATE OR REPLACE FUNCTION public.heal_user_missing_org(user_id uuid)
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
  SELECT org_id INTO v_org_id FROM public.profiles WHERE id = user_id;
  
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
  FROM public.orgs 
  WHERE email = v_email 
  LIMIT 1;

  -- Om ingen org finns, skapa en ny
  IF v_org_id IS NULL THEN
    v_org_name := COALESCE(
      v_user_metadata->>'org_name',
      split_part(v_email, '@', 1) || 's Hunddagis'
    );

    INSERT INTO public.orgs (name, org_number, email, vat_included, vat_rate)
    VALUES (
      v_org_name,
      v_user_metadata->>'org_number',
      v_email,
      true,
      25
    )
    RETURNING id INTO v_org_id;

    RAISE NOTICE '✅ Ny org skapad: %', v_org_id;

    -- Skapa prenumeration (om tabellen finns)
    BEGIN
      INSERT INTO public.org_subscriptions (org_id, plan, status, trial_starts_at, trial_ends_at, is_active)
      VALUES (
        v_org_id,
        'basic',
        'trialing',
        NOW(),
        NOW() + INTERVAL '3 months',
        true
      );
    EXCEPTION
      WHEN undefined_table THEN
        RAISE NOTICE '⚠️ org_subscriptions tabell finns inte, skippar prenumeration';
    END;
  END IF;

  -- Uppdatera eller skapa profilen med org_id
  INSERT INTO public.profiles (id, org_id, role, email, full_name, phone)
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

COMMENT ON FUNCTION public.heal_user_missing_org IS 
  'Fixar användare som saknar org_id genom att skapa/koppla organisation';

-- ============================================================================
-- STEG 3: VERIFIERING
-- ============================================================================

-- Kolla att funktionerna finns och är uppdaterade
SELECT 
  routine_name,
  routine_type,
  security_type,
  created
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN ('handle_new_user', 'heal_user_missing_org');

-- Kolla att triggern finns (skapad från schema.sql)
SELECT 
  trigger_name,
  event_manipulation,
  action_statement
FROM information_schema.triggers
WHERE event_object_schema = 'auth'
  AND event_object_table = 'users'
  AND trigger_name = 'on_auth_user_created';

-- ============================================================================
-- STEG 4: FIXA DIN ANVÄNDARE (om du har problemet NU)
-- ============================================================================
-- Byt ut 'din@email.com' mot din riktiga email:

-- SELECT heal_user_missing_org(
--   (SELECT id FROM auth.users WHERE email = 'din@email.com' LIMIT 1)
-- );

-- ============================================================================
-- STEG 5: FIXA ALLA användare med problem
-- ============================================================================
-- Kör denna för att fixa ALLA som saknar org_id:

-- SELECT 
--   au.email,
--   heal_user_missing_org(au.id) as result
-- FROM auth.users au
-- LEFT JOIN public.profiles p ON p.id = au.id
-- WHERE p.org_id IS NULL;

-- ============================================================================
-- SUCCESS! 🎉
-- ============================================================================
-- Om du ser inga fel ovan betyder det att:
-- ✅ handle_new_user() är uppdaterad och läser metadata
-- ✅ heal_user_missing_org() är skapad och kan fixa problem
-- ✅ Triggern finns redan från schema.sql
-- 
-- Nya användare kommer nu få org_id automatiskt!
-- Gamla användare fixas automatiskt vid nästa login (via AuthContext)
-- ============================================================================
