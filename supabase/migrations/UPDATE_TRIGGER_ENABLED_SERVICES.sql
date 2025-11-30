-- =====================================================
-- UPPDATERA handle_new_user() för enabled_services
-- =====================================================
-- Datum: 2025-11-30
-- Beskrivning: Uppdatera trigger för att hantera enabled_services istället för service_types
-- Detta säkerställer att nya användare får rätt tjänster aktiverade från start

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
BEGIN
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

  -- Create organization with enabled_services
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

  -- Create profile with org_id
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
  );

  RAISE NOTICE 'Created profile for user %: org_id=%', NEW.email, v_org_id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verifiera att funktionen uppdaterades
DO $$
BEGIN
    RAISE NOTICE '✅ handle_new_user() uppdaterad för att hantera enabled_services';
END $$;
