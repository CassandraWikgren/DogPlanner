-- ============================================================================
-- VERIFY & FIX CUSTOMER LOGIN
-- Datum: 7 December 2025
-- ============================================================================
-- Kör detta i Supabase SQL Editor för att diagnostisera och fixa kundlogin
-- ============================================================================

-- STEG 1: Visa alla auth-användare och deras status
SELECT 
  id,
  email,
  email_confirmed_at IS NOT NULL as is_confirmed,
  created_at,
  last_sign_in_at,
  raw_user_meta_data->>'full_name' as meta_name
FROM auth.users
ORDER BY created_at DESC;

-- STEG 2: Visa alla owners och deras koppling till auth
SELECT 
  o.id as owner_id,
  o.email as owner_email,
  o.full_name,
  o.customer_number,
  o.org_id,
  CASE 
    WHEN au.id IS NOT NULL THEN '✅ Kopplad till auth'
    ELSE '❌ SAKNAR auth-koppling!'
  END as auth_status
FROM owners o
LEFT JOIN auth.users au ON o.id = au.id
ORDER BY o.created_at DESC NULLS LAST;

-- STEG 3: Hitta användare i auth som SAKNAS i owners
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at IS NOT NULL as is_confirmed,
  '⚠️ Finns i auth men INTE i owners' as status
FROM auth.users au
LEFT JOIN owners o ON au.id = o.id
WHERE o.id IS NULL;

-- STEG 4: Specifik kontroll för testkund@dogplanner.se
SELECT 
  'AUTH USER' as source,
  id, 
  email,
  email_confirmed_at IS NOT NULL as is_confirmed
FROM auth.users 
WHERE email = 'testkund@dogplanner.se'

UNION ALL

SELECT 
  'OWNER' as source,
  id::text, 
  email,
  NULL as is_confirmed
FROM owners 
WHERE email = 'testkund@dogplanner.se';

-- ============================================================================
-- FIX: Om testkund finns i auth men inte i owners, skapa owner-rad
-- ============================================================================
-- INSERT INTO owners (id, email, full_name, phone, customer_number)
-- SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', 'Test Kund'), '070-1234567', '10001'
-- FROM auth.users 
-- WHERE email = 'testkund@dogplanner.se'
-- AND NOT EXISTS (SELECT 1 FROM owners WHERE email = 'testkund@dogplanner.se');

-- ============================================================================
-- FIX: Om owner finns men med FEL id (inte matchande auth.users.id)
-- ============================================================================
-- UPDATE owners 
-- SET id = (SELECT id FROM auth.users WHERE email = 'testkund@dogplanner.se')
-- WHERE email = 'testkund@dogplanner.se'
-- AND id != (SELECT id FROM auth.users WHERE email = 'testkund@dogplanner.se');

-- ============================================================================
-- FIX: Bekräfta e-post för testkund om inte bekräftad
-- ============================================================================
-- UPDATE auth.users
-- SET email_confirmed_at = NOW()
-- WHERE email = 'testkund@dogplanner.se'
-- AND email_confirmed_at IS NULL;

-- ============================================================================
-- VISA RLS-POLICYER FÖR OWNERS
-- ============================================================================
SELECT 
  policyname,
  cmd as operation,
  roles,
  qual as using_clause,
  with_check as with_check_clause
FROM pg_policies 
WHERE tablename = 'owners'
ORDER BY policyname;
