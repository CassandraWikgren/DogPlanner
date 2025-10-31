-- ============================================================================
-- Skapa organisation OCH profile för cassandrawikgren@icloud.com
-- ============================================================================

-- Hämta user ID från auth
DO $$
DECLARE
  v_user_id uuid;
  v_org_id uuid;
BEGIN
  -- Hämta användarens ID
  SELECT id INTO v_user_id
  FROM auth.users 
  WHERE email = 'cassandrawikgren@icloud.com';

  -- Skapa organisation
  INSERT INTO orgs (name, org_number, email, vat_included, vat_rate)
  VALUES (
    'Cassandras Hundcenter',
    '123456-7890',
    'cassandrawikgren@icloud.com',
    true,
    25
  )
  RETURNING id INTO v_org_id;

  -- Skapa profile och koppla till organisation (UTAN phone, den kolumnen finns inte)
  INSERT INTO profiles (id, org_id, role, email, full_name)
  VALUES (
    v_user_id,
    v_org_id,
    'admin',
    'cassandrawikgren@icloud.com',
    'Cassandra Wikgren'
  );

  RAISE NOTICE 'Organisation ID: %', v_org_id;
  RAISE NOTICE 'User ID: %', v_user_id;
END $$;

-- Verifiera att allt skapades:
SELECT 
  'Organisation' as typ,
  o.name,
  o.id::text as org_id,
  o.email
FROM orgs o
WHERE o.email = 'cassandrawikgren@icloud.com'

UNION ALL

SELECT 
  'Profile' as typ,
  p.full_name as name,
  p.id::text as user_id,
  p.email
FROM profiles p
WHERE p.email = 'cassandrawikgren@icloud.com';

-- ============================================================================
-- KLART! Logga ut och logga in igen:
-- https://dog-planner.vercel.app/login
-- Email: cassandrawikgren@icloud.com
-- Lösenord: MinHemligaKod123!
-- 
-- Nu ska du komma till Dashboard istället! 🎉
-- ============================================================================
