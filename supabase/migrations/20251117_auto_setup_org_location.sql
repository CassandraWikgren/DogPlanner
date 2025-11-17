-- ============================================================================
-- AUTO-SETUP ORG LOCATION VID REGISTRATION
-- ============================================================================
-- Uppdatering: 2025-11-17
-- Syfte: Sätt län, kommun, service_types och is_visible_to_customers automatiskt
--        när nya användare registrerar sig, så att orgs visas i OrganisationSelector
--
-- INSTALLATION:
-- 1. Kör denna SQL i Supabase SQL Editor
-- 2. Verifiera att trigger "on_auth_user_created" fortfarande finns
-- 3. Testa genom att registrera ett nytt konto via /register
-- ============================================================================

-- === STEG 1: LÄGG TILL KOLUMNER I ORGS-TABELLEN ===
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS lan text;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS kommun text;
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS service_types text[];
ALTER TABLE orgs ADD COLUMN IF NOT EXISTS is_visible_to_customers boolean DEFAULT true;

-- === STEG 2: UPPDATERA HANDLE_NEW_USER FUNKTIONEN ===
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
  v_lan text;
  v_kommun text;
  v_service_types text[];
BEGIN
  -- Läs metadata från registreringsformuläret
  v_org_name := COALESCE(NEW.raw_user_meta_data->>'org_name', split_part(NEW.email, '@', 1) || 's Hunddagis');
  v_org_number := NEW.raw_user_meta_data->>'org_number';
  v_full_name := NEW.raw_user_meta_data->>'full_name';
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_lan := NEW.raw_user_meta_data->>'lan';
  v_kommun := NEW.raw_user_meta_data->>'kommun';
  
  -- Service types från metadata (JSON array → PostgreSQL array)
  BEGIN
    v_service_types := ARRAY(
      SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'service_types')
    );
  EXCEPTION WHEN OTHERS THEN
    v_service_types := ARRAY[]::text[]; -- Fallback om parsing misslyckas
  END;

  RAISE NOTICE '🔵 handle_new_user: Skapar org för % med metadata: org_name=%, län=%, kommun=%, services=%', 
    NEW.email, v_org_name, v_lan, v_kommun, v_service_types;

  -- Skapa organisationen MED alla värden från registreringen
  INSERT INTO orgs (
    name, 
    org_number, 
    email, 
    vat_included, 
    vat_rate,
    lan,
    kommun,
    service_types,
    is_visible_to_customers
  )
  VALUES (
    v_org_name,
    v_org_number,
    NEW.email,
    true,
    25,
    v_lan,
    v_kommun,
    COALESCE(v_service_types, ARRAY[]::text[]),
    true  -- 🔥 Gör synlig direkt så den visas i OrganisationSelector
  )
  RETURNING id INTO v_org_id;

  RAISE NOTICE '✅ Organisation skapad: % med län=%, kommun=%, services=%, is_visible=%', 
    v_org_id, v_lan, v_kommun, v_service_types, true;

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
    now(),
    now() + INTERVAL '3 months',
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

-- ============================================================================
-- VERIFIERA ATT TRIGGER FINNS
-- ============================================================================
-- Du kan INTE skapa trigger på auth.users via SQL Editor (permissions-fel)
-- Om triggern saknas, skapa den manuellt:
-- 
-- 1. Gå till: Supabase Dashboard → Database → Triggers
-- 2. Klicka: Create a new trigger
-- 3. Fyll i:
--    Name: on_auth_user_created
--    Table: auth.users
--    Events: INSERT
--    Type: AFTER
--    Orientation: ROW
--    Function: handle_new_user
-- 4. Save trigger
-- ============================================================================

-- Kontrollera att triggern finns (kör denna query för att verifiera):
SELECT 
  tgname AS trigger_name,
  tgrelid::regclass AS table_name,
  tgtype::text AS trigger_type,
  proname AS function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
WHERE tgname = 'on_auth_user_created';

-- Förväntat resultat:
-- trigger_name          | table_name | trigger_type | function_name
-- ----------------------|------------|--------------|----------------
-- on_auth_user_created  | users      | AFTER INSERT | handle_new_user

-- ============================================================================
-- TESTNING
-- ============================================================================
-- 1. Registrera ett nytt konto via /register med:
--    - Län: t.ex. "Stockholms län"
--    - Kommun: t.ex. "Stockholm"
--    - Service types: välj minst en
--
-- 2. Verifiera att org skapades korrekt:
SELECT 
  id,
  name,
  lan,
  kommun,
  service_types,
  is_visible_to_customers,
  created_at
FROM orgs
WHERE email = 'DIN@EMAIL.SE'
ORDER BY created_at DESC
LIMIT 1;

-- Förväntat resultat:
-- ✅ län = "Stockholms län"
-- ✅ kommun = "Stockholm"
-- ✅ service_types = {"hunddagis"} eller {"hundpensionat"} etc.
-- ✅ is_visible_to_customers = true
--
-- 3. Verifiera att org:en visas i OrganisationSelector:
--    - Gå till /ansokan/pensionat (eller /hunddagis)
--    - Välj län + kommun
--    - Din org ska visas i listan!
--
-- ============================================================================

-- Om något går fel, kör denna query för att se senaste trigger-loggar:
-- (Kräver att du har access till Supabase logs)
-- SELECT * FROM pg_stat_statements WHERE query LIKE '%handle_new_user%';

-- ============================================================================
-- BACKUP AV GAMLA FUNKTIONEN
-- ============================================================================
-- Den gamla versionen utan län/kommun/service_types finns i:
-- supabase/migrations/PERMANENT_FIX_org_assignment.sql
-- ============================================================================
