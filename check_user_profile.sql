-- ============================================================================
-- Kolla profil och organisation för cassandrawikgren@icloud.com
-- ============================================================================

-- 1. Kolla om profil finns
SELECT 
  'PROFILE' as tabell,
  id,
  email,
  full_name,
  org_id,
  role
FROM profiles 
WHERE email = 'cassandrawikgren@icloud.com';

-- 2. Kolla vilka organisationer som finns
SELECT 
  'ORGANISATIONER' as info,
  id,
  name,
  email,
  org_number
FROM orgs;

-- 3. Kolla auth användare
SELECT 
  'AUTH USER' as tabell,
  id,
  email,
  email_confirmed_at,
  raw_user_meta_data
FROM auth.users 
WHERE email = 'cassandrawikgren@icloud.com';
