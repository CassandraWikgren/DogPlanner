-- ============================================================================
-- Fixa profil och organisation för cassandrawikgren@icloud.com
-- Kör denna i Supabase SQL Editor (Production-databasen)
-- ============================================================================

-- Först, kolla vad som finns:
SELECT 
  'AUTH USER' as check_type,
  id::text as id,
  email,
  email_confirmed_at
FROM auth.users 
WHERE email = 'cassandrawikgren@icloud.com';

SELECT 
  'PROFILE' as check_type,
  id::text as id,
  email,
  org_id::text,
  role
FROM profiles 
WHERE email = 'cassandrawikgren@icloud.com';

SELECT 
  'ORGANISATIONS' as check_type,
  id::text,
  name,
  email
FROM orgs
ORDER BY created_at DESC
LIMIT 5;

-- ============================================================================
-- Skapa organisation OCH profil om de inte finns
-- ============================================================================

DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
  v_profile_exists boolean;
  v_org_exists boolean;
BEGIN
  -- Hämta användarens ID från auth.users
  SELECT id INTO v_user_id
  FROM auth.users 
  WHERE email = 'cassandrawikgren@icloud.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Användare med email cassandrawikgren@icloud.com finns inte i auth.users!';
  END IF;

  RAISE NOTICE 'Användare hittad: %', v_user_id;

  -- Kolla om profil redan finns
  SELECT EXISTS(
    SELECT 1 FROM profiles WHERE id = v_user_id
  ) INTO v_profile_exists;

  -- Kolla om organisation finns
  SELECT id INTO v_org_id
  FROM orgs 
  WHERE email = 'cassandrawikgren@icloud.com';

  v_org_exists := (v_org_id IS NOT NULL);

  -- Skapa organisation om den inte finns
  IF NOT v_org_exists THEN
    RAISE NOTICE 'Skapar organisation...';
    INSERT INTO orgs (name, org_number, email, vat_included, vat_rate)
    VALUES (
      'Cassandras Hundcenter',
      '123456-7890',
      'cassandrawikgren@icloud.com',
      true,
      25
    )
    RETURNING id INTO v_org_id;
    RAISE NOTICE 'Organisation skapad: %', v_org_id;
  ELSE
    RAISE NOTICE 'Organisation finns redan: %', v_org_id;
  END IF;

  -- Skapa eller uppdatera profil
  IF v_profile_exists THEN
    RAISE NOTICE 'Profil finns, uppdaterar org_id...';
    UPDATE profiles 
    SET 
      org_id = v_org_id,
      role = 'admin',
      email = 'cassandrawikgren@icloud.com',
      full_name = COALESCE(full_name, 'Cassandra Wikgren')
    WHERE id = v_user_id;
    RAISE NOTICE 'Profil uppdaterad!';
  ELSE
    RAISE NOTICE 'Skapar ny profil...';
    INSERT INTO profiles (id, org_id, role, email, full_name)
    VALUES (
      v_user_id,
      v_org_id,
      'admin',
      'cassandrawikgren@icloud.com',
      'Cassandra Wikgren'
    );
    RAISE NOTICE 'Profil skapad!';
  END IF;

  RAISE NOTICE '✅ KLART! Organisation ID: %, User ID: %', v_org_id, v_user_id;
END $$;

-- ============================================================================
-- Verifiera att allt är OK:
-- ============================================================================

SELECT 
  'FINAL CHECK' as status,
  'Organisation' as typ,
  o.name,
  o.id::text as org_id,
  o.email
FROM orgs o
WHERE o.email = 'cassandrawikgren@icloud.com'

UNION ALL

SELECT 
  'FINAL CHECK' as status,
  'Profile' as typ,
  p.full_name as name,
  p.org_id::text,
  p.email
FROM profiles p
WHERE p.email = 'cassandrawikgren@icloud.com';

-- ============================================================================
-- INSTRUKTIONER:
-- 
-- 1. Kopiera hela denna SQL och kör den i Supabase SQL Editor
-- 2. Verifiera att du ser "✅ KLART!" i output
-- 3. Kolla "FINAL CHECK" - båda raderna ska visa samma org_id
-- 4. Gå till din app och ladda om sidan (Cmd+R)
-- 5. Nu ska "Ingen organisation tilldelad" vara borta! 🎉
-- ============================================================================
