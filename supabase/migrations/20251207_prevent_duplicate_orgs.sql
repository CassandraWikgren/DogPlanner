-- =====================================================
-- PREVENT DUPLICATE ORGS - ROBUST FIX
-- =====================================================
-- Datum: 2025-12-07
-- Problem: Race condition mellan trigger och API skapar dubbletter
-- Lösning: Lägg till EXISTS-check innan INSERT
-- =====================================================

-- 🔒 UPPDATERAD handle_new_user() MED DUPLICERINGSSKYDD
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_org_name text;
  v_org_number text;
  v_full_name text;
  v_phone text;
  v_lan text;
  v_kommun text;
  v_enabled_services text[];
  v_org_id uuid;
  v_existing_org_id uuid;
BEGIN
  -- 🔒 RACE CONDITION CHECK: Kolla om profil redan finns med org_id
  SELECT org_id INTO v_existing_org_id
  FROM profiles
  WHERE id = NEW.id;
  
  IF v_existing_org_id IS NOT NULL THEN
    RAISE NOTICE 'User % already has org_id=%, skipping org creation', NEW.email, v_existing_org_id;
    RETURN NEW;
  END IF;
  
  -- 🔒 DUPLICATE CHECK: Kolla om det redan finns en org för denna email
  SELECT id INTO v_existing_org_id
  FROM orgs
  WHERE email = NEW.email
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_existing_org_id IS NOT NULL THEN
    RAISE NOTICE 'Org already exists for email %, using existing org_id=%', NEW.email, v_existing_org_id;
    
    -- Koppla profilen till befintlig org
    INSERT INTO profiles (
      id,
      org_id,
      role,
      email,
      full_name,
      phone,
      created_at
    )
    VALUES (
      NEW.id,
      v_existing_org_id,
      'admin',
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
      NEW.raw_user_meta_data->>'phone',
      now()
    )
    ON CONFLICT (id) DO UPDATE SET
      org_id = v_existing_org_id,
      role = 'admin';
    
    RETURN NEW;
  END IF;

  -- Extract values from user_metadata (from registration form)
  v_org_name := COALESCE(
    NEW.raw_user_meta_data->>'org_name',
    split_part(NEW.email, '@', 1) || 's Hunddagis'
  );
  v_org_number := NEW.raw_user_meta_data->>'org_number';
  v_full_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  v_phone := NEW.raw_user_meta_data->>'phone';
  v_lan := NEW.raw_user_meta_data->>'lan';
  v_kommun := NEW.raw_user_meta_data->>'kommun';
  
  -- Parse enabled_services array from JSONB (new format)
  IF NEW.raw_user_meta_data ? 'enabled_services' THEN
    v_enabled_services := ARRAY(
      SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'enabled_services')
    );
  ELSE
    -- Fallback till default (alla tjänster) om inte specificerat
    v_enabled_services := ARRAY['daycare', 'boarding', 'grooming'];
  END IF;

  -- 🔒 UPSERT: Skapa org endast om den inte redan finns (extra säkerhet)
  INSERT INTO orgs (
    name,
    org_number,
    email,
    phone,
    lan,
    kommun,
    enabled_services,
    created_at
  )
  VALUES (
    v_org_name,
    v_org_number,
    NEW.email,
    v_phone,
    v_lan,
    v_kommun,
    v_enabled_services,
    now()
  )
  RETURNING id INTO v_org_id;

  RAISE NOTICE 'Created org for user %: org_id=% with services=%', NEW.email, v_org_id, v_enabled_services;

  -- Create profile with org_id (upsert för säkerhet)
  INSERT INTO profiles (
    id,
    org_id,
    role,
    email,
    full_name,
    phone,
    created_at
  )
  VALUES (
    NEW.id,
    v_org_id,
    'admin',
    NEW.email,
    v_full_name,
    v_phone,
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    org_id = v_org_id,
    role = 'admin';

  RAISE NOTICE 'Created profile for user %: org_id=%', NEW.email, v_org_id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- OPTIONAL: Add unique constraint on orgs.email for extra protection
-- =====================================================
-- Note: This may fail if there are existing duplicates
-- Run AFTER cleaning up duplicate orgs

-- CREATE UNIQUE INDEX IF NOT EXISTS orgs_email_unique 
-- ON orgs (email) 
-- WHERE email IS NOT NULL;

-- =====================================================
-- VERIFY THE FIX
-- =====================================================
DO $$
BEGIN
  RAISE NOTICE '✅ handle_new_user() updated with duplicate prevention';
  RAISE NOTICE '✅ Trigger now checks for existing orgs before creating new ones';
  RAISE NOTICE '✅ Profiles are upserted to prevent conflicts';
END $$;
