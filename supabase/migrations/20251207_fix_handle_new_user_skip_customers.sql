-- =====================================================
-- FIX: handle_new_user() should NOT create profiles for customers
-- =====================================================
-- Datum: 2025-12-07
-- Problem: Trigger creates profiles for ALL users, including customers
--          who register via /kundportal/registrera
-- Lösning: Check user_metadata.user_type - skip profile creation for customers
-- =====================================================

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
  v_user_type text;
BEGIN
  -- 🆕 CHECK USER TYPE: Skip profile creation for customers!
  -- Customers register via /kundportal/registrera and set user_type = 'customer'
  v_user_type := NEW.raw_user_meta_data->>'user_type';
  
  IF v_user_type = 'customer' OR v_user_type = 'owner' OR v_user_type = 'kund' THEN
    RAISE NOTICE 'User % is a CUSTOMER (user_type=%), skipping profile/org creation', NEW.email, v_user_type;
    RETURN NEW; -- Exit early - customers don't get profiles!
  END IF;

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
  
  -- Handle enabled_services from metadata
  BEGIN
    IF NEW.raw_user_meta_data->'enabled_services' IS NOT NULL THEN
      SELECT array_agg(elem::text)
      INTO v_enabled_services
      FROM jsonb_array_elements_text(NEW.raw_user_meta_data->'enabled_services') AS elem;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    v_enabled_services := NULL;
  END;
  
  -- Default: all services if not specified (for business registrations)
  IF v_enabled_services IS NULL OR array_length(v_enabled_services, 1) IS NULL THEN
    v_enabled_services := ARRAY['daycare', 'boarding', 'grooming'];
  END IF;

  -- Create organisation
  INSERT INTO orgs (
    name,
    org_number,
    email,
    phone,
    lan,
    kommun,
    status,
    subscription_status,
    subscription_plan,
    trial_ends_at,
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
    'trialing',
    'trial',
    'basic',
    now() + interval '2 months',
    v_enabled_services,
    ARRAY['hunddagis', 'hundpensionat', 'hundfrisor'],
    now()
  )
  RETURNING id INTO v_org_id;

  -- Create profile linked to org
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
    role = 'admin',
    email = NEW.email,
    full_name = v_full_name,
    phone = v_phone;

  RAISE NOTICE 'Created org % and profile for business user %', v_org_id, NEW.email;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'handle_new_user failed for %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Verify
DO $$
BEGIN
  RAISE NOTICE '✅ handle_new_user() updated - now skips customers with user_type=customer/owner/kund';
END $$;
