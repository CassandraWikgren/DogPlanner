-- =====================================================
-- FIX: handle_new_user() ska uppdatera BÅDA kolumnerna
-- =====================================================
-- Datum: 2025-11-30
-- Problem: Triggern uppdaterar antingen service_types ELLER enabled_services
-- Lösning: Uppdatera BÅDA kolumnerna från samma källa i user_metadata
--
-- VARFÖR BÅDA BEHÖVS:
-- - service_types: Vilka tjänster organisationen ERBJUDER publikt (för OrganisationSelector - kunder väljer företag)
-- - enabled_services: Vilka funktioner organisationen har ÅTKOMST TILL i plattformen (för ServiceGuard - visning av menyer/funktioner)

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
  v_service_types text[];
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
  
  -- Parse enabled_services array from JSONB (new modular system)
  IF NEW.raw_user_meta_data ? 'enabled_services' THEN
    v_enabled_services := ARRAY(
      SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'enabled_services')
    );
    -- VIKTIG: Sätt samma värden för service_types (för publikt synlighet)
    v_service_types := v_enabled_services;
  ELSIF NEW.raw_user_meta_data ? 'service_types' THEN
    -- Fallback för äldre registreringar
    v_service_types := ARRAY(
      SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'service_types')
    );
    v_enabled_services := v_service_types;
  ELSE
    -- Default: alla tjänster
    v_enabled_services := ARRAY['daycare', 'boarding', 'grooming'];
    v_service_types := ARRAY['hunddagis', 'hundpensionat', 'hundfrisor'];
  END IF;

  -- Create organization with BÅDA kolumnerna
  INSERT INTO orgs (
    name,
    org_number,
    email,
    phone,
    lan,
    kommun,
    enabled_services,
    service_types,
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
    v_service_types,
    now()
  )
  RETURNING id INTO v_org_id;

  RAISE NOTICE 'Created org for user %: org_id=% with enabled_services=% and service_types=%', 
    NEW.email, v_org_id, v_enabled_services, v_service_types;

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

  -- Create 3-month trial subscription (från gamla triggern)
  INSERT INTO org_subscriptions (
    org_id,
    status,
    trial_ends_at,
    created_at
  )
  VALUES (
    v_org_id,
    'trialing',
    now() + interval '3 months',
    now()
  );

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verifiera att triggern existerar (ska redan finnas från tidigare migration)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_auth_user_created'
    ) THEN
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW
            EXECUTE FUNCTION handle_new_user();
    END IF;
    
    RAISE NOTICE '✅ handle_new_user() uppdaterad för att hantera BÅDE enabled_services OCH service_types';
END $$;
