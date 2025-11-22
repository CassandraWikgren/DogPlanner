-- =====================================================
-- PERMANENT FIX: 3-Layer org_id Assignment System
-- =====================================================
-- Problem: Användare såg "Ingen organisation tilldelad" trots korrekt registrering
-- Lösning: Triple-redundancy system som garanterar org_id assignment
--
-- Layer 1: Enhanced database trigger (primary)
-- Layer 2: Auto-onboarding API (fallback)
-- Layer 3: Healing RPC function (recovery)

-- =====================================================
-- LAYER 1: Enhanced handle_new_user() Trigger Function
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
  
  -- Parse service_types array from JSONB
  IF NEW.raw_user_meta_data ? 'service_types' THEN
    v_service_types := ARRAY(
      SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'service_types')
    );
  END IF;

  -- Create organization with proper values
  INSERT INTO orgs (
    name,
    org_number,
    email,
    phone,
    lan,
    kommun,
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
    v_service_types,
    now()
  )
  RETURNING id INTO v_org_id;

  RAISE NOTICE 'Created org for user %: org_id=%', NEW.email, v_org_id;

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
    'admin', -- First user is always admin
    NEW.email,
    v_full_name,
    v_phone,
    now()
  );

  RAISE NOTICE 'Created profile for user %: org_id=%', NEW.email, v_org_id;

  -- Create 3-month trial subscription
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

  RAISE NOTICE 'Created trial subscription for org_id=%', v_org_id;

  RETURN NEW;

EXCEPTION
  WHEN OTHERS THEN
    -- Don't block registration if trigger fails
    -- Layer 2 (API) will catch this
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

-- =====================================================
-- LAYER 3: Healing RPC Function
-- =====================================================

CREATE OR REPLACE FUNCTION heal_user_missing_org(user_id_param uuid)
RETURNS jsonb AS $$
DECLARE
  v_user_email text;
  v_user_metadata jsonb;
  v_org_name text;
  v_org_number text;
  v_full_name text;
  v_phone text;
  v_lan text;
  v_kommun text;
  v_service_types text[];
  v_org_id uuid;
  v_profile_exists boolean;
BEGIN
  -- Get user info from auth.users
  SELECT email, raw_user_meta_data
  INTO v_user_email, v_user_metadata
  FROM auth.users
  WHERE id = user_id_param;

  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found in auth.users'
    );
  END IF;

  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = user_id_param)
  INTO v_profile_exists;

  -- Extract metadata
  v_org_name := COALESCE(
    v_user_metadata->>'org_name',
    split_part(v_user_email, '@', 1) || 's Hunddagis'
  );
  v_org_number := v_user_metadata->>'org_number';
  v_full_name := COALESCE(
    v_user_metadata->>'full_name',
    split_part(v_user_email, '@', 1)
  );
  v_phone := v_user_metadata->>'phone';
  v_lan := v_user_metadata->>'lan';
  v_kommun := v_user_metadata->>'kommun';

  IF v_user_metadata ? 'service_types' THEN
    v_service_types := ARRAY(
      SELECT jsonb_array_elements_text(v_user_metadata->'service_types')
    );
  END IF;

  -- Try to find existing org by email or org_number
  SELECT id INTO v_org_id
  FROM orgs
  WHERE email = v_user_email
     OR (org_number IS NOT NULL AND org_number = v_org_number)
  LIMIT 1;

  -- If no org found, create one
  IF v_org_id IS NULL THEN
    INSERT INTO orgs (
      name,
      org_number,
      email,
      phone,
      lan,
      kommun,
      service_types,
      created_at
    )
    VALUES (
      v_org_name,
      v_org_number,
      v_user_email,
      v_phone,
      v_lan,
      v_kommun,
      v_service_types,
      now()
    )
    RETURNING id INTO v_org_id;

    RAISE NOTICE 'Healing: Created new org for user %: org_id=%', v_user_email, v_org_id;
  ELSE
    RAISE NOTICE 'Healing: Found existing org for user %: org_id=%', v_user_email, v_org_id;
  END IF;

  -- Update or create profile
  IF v_profile_exists THEN
    UPDATE profiles
    SET org_id = v_org_id,
        full_name = COALESCE(full_name, v_full_name),
        phone = COALESCE(phone, v_phone),
        updated_at = now()
    WHERE id = user_id_param;

    RAISE NOTICE 'Healing: Updated profile for user %', v_user_email;
  ELSE
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
      user_id_param,
      v_org_id,
      'admin',
      v_user_email,
      v_full_name,
      v_phone,
      now()
    );

    RAISE NOTICE 'Healing: Created profile for user %', v_user_email;
  END IF;

  -- Ensure trial subscription exists
  IF NOT EXISTS(SELECT 1 FROM org_subscriptions WHERE org_id = v_org_id) THEN
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

    RAISE NOTICE 'Healing: Created trial subscription for org_id=%', v_org_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'org_id', v_org_id,
    'message', 'User healed successfully'
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- VERIFICATION & BULK HEALING
-- =====================================================

-- View to check users without org_id
CREATE OR REPLACE VIEW users_without_org AS
SELECT 
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'org_name' as intended_org_name,
  p.org_id
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
WHERE p.org_id IS NULL
ORDER BY u.created_at DESC;

-- Function to heal all users without org_id
CREATE OR REPLACE FUNCTION heal_all_users_missing_org()
RETURNS jsonb AS $$
DECLARE
  user_record RECORD;
  healed_count integer := 0;
  failed_count integer := 0;
  result jsonb;
BEGIN
  FOR user_record IN 
    SELECT id, email FROM users_without_org
  LOOP
    BEGIN
      result := heal_user_missing_org(user_record.id);
      
      IF result->>'success' = 'true' THEN
        healed_count := healed_count + 1;
        RAISE NOTICE 'Healed user: %', user_record.email;
      ELSE
        failed_count := failed_count + 1;
        RAISE WARNING 'Failed to heal user %: %', user_record.email, result->>'error';
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        failed_count := failed_count + 1;
        RAISE WARNING 'Error healing user %: %', user_record.email, SQLERRM;
    END;
  END LOOP;

  RETURN jsonb_build_object(
    'healed', healed_count,
    'failed', failed_count,
    'total', healed_count + failed_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
