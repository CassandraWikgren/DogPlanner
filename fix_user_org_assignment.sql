-- Fix user profile org_id assignment
-- This script helps fix the "Ingen organisation tilldelad" error
-- when a user has an organization but the profile.org_id is missing

-- Step 1: Check current state
SELECT 
  'Current User Profile' as check_type,
  p.id,
  p.email,
  p.org_id,
  p.role,
  au.email as auth_email
FROM profiles p
LEFT JOIN auth.users au ON au.id = p.id
ORDER BY p.created_at DESC
LIMIT 5;

-- Step 2: Check existing organizations
SELECT 
  'Organizations' as check_type,
  id,
  name,
  org_number,
  email,
  created_at
FROM orgs
ORDER BY created_at DESC
LIMIT 5;

-- Step 3: Find users without org_id (if the query above shows NULL org_id)
-- SELECT 
--   'Users without org' as check_type,
--   p.id,
--   p.email,
--   au.raw_user_meta_data
-- FROM profiles p
-- LEFT JOIN auth.users au ON au.id = p.id
-- WHERE p.org_id IS NULL;

-- Step 4: FIX - Match user to organization by email
-- IMPORTANT: Run this only after verifying the data above!
-- Uncomment the UPDATE below when ready:

/*
WITH user_org_match AS (
  SELECT 
    p.id as user_id,
    o.id as matched_org_id,
    p.email,
    o.name as org_name
  FROM profiles p
  LEFT JOIN orgs o ON (
    -- Try to match by email domain or org_number from metadata
    o.email = p.email 
    OR o.id::text = (SELECT raw_user_meta_data->>'org_id' FROM auth.users WHERE id = p.id)
  )
  WHERE p.org_id IS NULL
  AND o.id IS NOT NULL
)
UPDATE profiles p
SET 
  org_id = m.matched_org_id,
  updated_at = now()
FROM user_org_match m
WHERE p.id = m.user_id;
*/

-- Alternative manual fix if you know the specific user email and org:
-- Replace 'user@example.com' with your actual email
-- Replace 'org-uuid-here' with your actual organization UUID

/*
UPDATE profiles
SET org_id = (
  SELECT id 
  FROM orgs 
  WHERE org_number = 123456 -- Replace with your actual org_number
  LIMIT 1
)
WHERE email = 'user@example.com' -- Replace with your actual email
AND org_id IS NULL;
*/

-- Step 5: Verify the fix
SELECT 
  'After Fix' as check_type,
  p.id,
  p.email,
  p.org_id,
  o.name as org_name,
  o.org_number
FROM profiles p
LEFT JOIN orgs o ON o.id = p.org_id
WHERE p.email = 'user@example.com' -- Replace with your actual email
LIMIT 1;
