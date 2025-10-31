-- ============================================================================
-- Bekräfta e-post OCH sätt nytt lösenord för cassandrawikgren@icloud.com
-- ============================================================================

UPDATE auth.users 
SET 
  email_confirmed_at = NOW(),
  confirmation_token = '',
  encrypted_password = crypt('MinHemligaKod123!', gen_salt('bf'))  -- NYTT LÖSENORD!
WHERE email = 'cassandrawikgren@icloud.com';

-- Verifiera att det fungerade:
SELECT 
  email,
  email_confirmed_at,
  created_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '✅ Bekräftad'
    ELSE '❌ Ej bekräftad'
  END as status
FROM auth.users 
WHERE email = 'cassandrawikgren@icloud.com';

-- ============================================================================
-- KLART! Nu kan du logga in på https://dog-planner.vercel.app/login med:
-- Email: cassandrawikgren@icloud.com
-- Lösenord: MinHemligaKod123!
-- 
-- OBS! Byt lösenord efter första inloggningen!
-- ============================================================================
