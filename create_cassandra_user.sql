-- ============================================================================
-- Skapa användare för Cassandra Wikgren
-- Kör denna SQL i Supabase SQL Editor
-- ============================================================================

-- STEG 0: Ta bort ALLT gammalt först
-- Ta bort profilen först (annars blockerar den användarborttagningen)
DELETE FROM profiles WHERE email = 'cassandrawikgren@icloud.com' OR id = 'a1234567-89ab-cdef-0123-456789abcdef'::uuid;

-- Ta bort auth identitet och användare
DELETE FROM auth.identities WHERE provider = 'email' AND identity_data->>'email' = 'cassandrawikgren@icloud.com';
DELETE FROM auth.users WHERE email = 'cassandrawikgren@icloud.com' OR id = 'a1234567-89ab-cdef-0123-456789abcdef'::uuid;

-- 1. Skapa organisation först
INSERT INTO orgs (id, name, org_number, email, vat_included, vat_rate)
VALUES (
  'c1234567-89ab-cdef-0123-456789abcdef'::uuid,
  'Cassandras Hundcenter',
  '123456-7890',
  'cassandrawikgren@icloud.com',  -- Viktigt: Samma e-postadress så triggern hittar rätt org!
  true,
  25
)
ON CONFLICT (id) DO NOTHING;

-- 2. Skapa användare i auth.users (Supabase Auth)
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  role,
  aud,
  confirmation_token
)
VALUES (
  'a1234567-89ab-cdef-0123-456789abcdef'::uuid,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'cassandrawikgren@icloud.com',
  crypt('MinHemligaKod123!', gen_salt('bf')), -- Ändra detta lösenord!
  NOW(), -- Email bekräftad direkt
  NOW(),
  NOW(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  '{"full_name":"Cassandra Wikgren","phone":"070-123 45 67"}'::jsonb,
  false,
  'authenticated',
  'authenticated',
  ''
)
ON CONFLICT (id) DO NOTHING;

-- 3. Skapa identitet för användaren
INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  last_sign_in_at,
  created_at,
  updated_at
)
VALUES (
  'a1234567-89ab-cdef-0123-456789abcdef'::uuid,
  'a1234567-89ab-cdef-0123-456789abcdef'::uuid,
  '{"sub":"a1234567-89ab-cdef-0123-456789abcdef","email":"cassandrawikgren@icloud.com"}'::jsonb,
  'email',
  NOW(),
  NOW(),
  NOW()
)
ON CONFLICT (id, provider) DO NOTHING;

-- 4. Profilen skapas automatiskt av triggern assign_org_to_new_user()
--    Så vi behöver inte skapa den manuellt!

-- 5. Bekräfta att allt skapades
SELECT 
  'Organisation' as typ,
  name as namn,
  id::text as id
FROM orgs 
WHERE id = 'c1234567-89ab-cdef-0123-456789abcdef'::uuid

UNION ALL

SELECT 
  'Auth User' as typ,
  email as namn,
  id::text as id
FROM auth.users 
WHERE id = 'a1234567-89ab-cdef-0123-456789abcdef'::uuid

UNION ALL

SELECT 
  'Profile' as typ,
  full_name as namn,
  id::text as id
FROM profiles 
WHERE id = 'a1234567-89ab-cdef-0123-456789abcdef'::uuid;

-- ============================================================================
-- KLART! Du kan nu logga in med:
-- Email: cassandrawikgren@icloud.com
-- Lösenord: MinHemligaKod123!
-- 
-- OBS! Ändra lösenordet efter första inloggningen!
-- ============================================================================
