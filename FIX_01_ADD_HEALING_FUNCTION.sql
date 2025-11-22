-- =====================================================
-- KRITISK FIX: Lägg till heal_user_missing_org() funktion
-- =====================================================
-- PROBLEM: Funktionen anropas från AuthContext men finns inte i databasen
-- KÄLLA: supabase/migrations/PERMANENT_FIX_org_assignment.sql
-- DATUM: 2025-11-22
--
-- KÖR DENNA I SUPABASE SQL EDITOR NU!
-- =====================================================

-- Drop existing function if it exists (allows parameter name change)
DROP FUNCTION IF EXISTS heal_user_missing_org(uuid);

CREATE OR REPLACE FUNCTION heal_user_missing_org(p_user_id uuid)
RETURNS jsonb 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
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
  WHERE id = p_user_id;

  IF v_user_email IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'User not found in auth.users'
    );
  END IF;

  -- Check if profile exists
  SELECT EXISTS(SELECT 1 FROM profiles WHERE id = p_user_id)
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
    WHERE id = p_user_id;

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
      p_user_id,
      v_org_id,
      'admin',
      v_user_email,
      v_full_name,
      v_phone,
      now()
    );

    RAISE NOTICE 'Healing: Created profile for user %', v_user_email;
  END IF;

  -- Ensure subscription exists
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
  )
  ON CONFLICT (org_id) DO NOTHING;

  RAISE NOTICE 'Healing: Ensured subscription for org_id=%', v_org_id;

  RETURN jsonb_build_object(
    'success', true,
    'org_id', v_org_id,
    'message', 'User healed successfully',
    'profile_existed', v_profile_exists
  );

EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- =====================================================
-- VERIFIERING
-- =====================================================

-- 1. Verifiera att funktionen finns
SELECT 
  routine_name,
  routine_type,
  data_type as return_type
FROM information_schema.routines
WHERE routine_name = 'heal_user_missing_org'
  AND routine_schema = 'public';

-- Om ovan query returnerar 1 rad så är funktionen installerad! ✅

-- 2. Testa funktionen (frivilligt - byt ut test-uuid)
-- SELECT heal_user_missing_org('00000000-0000-0000-0000-000000000000'::uuid);

-- =====================================================
-- NÄSTA STEG
-- =====================================================
-- 1. Kör denna SQL i Supabase SQL Editor
-- 2. Verifiera att verifieringsqueryn returnerar 1 rad
-- 3. Testa healing-funktionen med ett riktigt user_id om du vill
-- 4. Fortsätt med nästa fix från SYSTEM_AUDIT_KOMPLETT_2025-11-22.md
