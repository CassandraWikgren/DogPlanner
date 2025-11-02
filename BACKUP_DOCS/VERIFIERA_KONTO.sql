-- ========================================
-- VERIFIERA DITT BEFINTLIGA KONTO
-- Kör dessa queries i Supabase SQL Editor
-- ========================================

-- === 1. KOLLA DIN ANVÄNDARE & PROFIL ===
-- Byt ut 'din@email.se' mot din riktiga e-postadress

SELECT 
  u.id as user_id,
  u.email,
  u.created_at as registered_at,
  p.org_id,
  p.role,
  p.full_name,
  p.phone,
  o.name as org_name,
  o.org_number,
  o.email as org_email
FROM auth.users u
LEFT JOIN profiles p ON p.id = u.id
LEFT JOIN orgs o ON o.id = p.org_id
WHERE u.email = 'din@email.se';  -- ⬅️ ÄNDRA DETTA!

-- === 2. KOLLA PRENUMERATION ===
SELECT 
  s.plan,
  s.status,
  s.trial_starts_at,
  s.trial_ends_at,
  CASE 
    WHEN s.trial_ends_at > NOW() THEN '✅ Trial aktiv'
    WHEN s.trial_ends_at < NOW() THEN '⚠️ Trial utgången'
    ELSE '❓ Ingen trial'
  END as trial_status,
  o.name as org_name
FROM subscriptions s
JOIN orgs o ON o.id = s.org_id
JOIN profiles p ON p.org_id = o.id
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'din@email.se';  -- ⬅️ ÄNDRA DETTA!

-- === 3. KOLLA OM DU HAR HUNDAR ===
SELECT 
  d.id,
  d.name as dog_name,
  d.breed,
  d.created_at,
  o.name as org_name,
  ow.full_name as owner_name
FROM dogs d
JOIN orgs o ON o.id = d.org_id
LEFT JOIN owners ow ON ow.id = d.owner_id
JOIN profiles p ON p.org_id = o.id
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'din@email.se'  -- ⬅️ ÄNDRA DETTA!
ORDER BY d.created_at DESC;

-- === 4. KOLLA OM DU HAR ÄGARE ===
SELECT 
  ow.id,
  ow.full_name,
  ow.email,
  ow.phone,
  ow.customer_number,
  o.name as org_name,
  COUNT(d.id) as antal_hundar
FROM owners ow
JOIN orgs o ON o.id = ow.org_id
LEFT JOIN dogs d ON d.owner_id = ow.id
JOIN profiles p ON p.org_id = o.id
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'din@email.se'  -- ⬅️ ÄNDRA DETTA!
GROUP BY ow.id, ow.full_name, ow.email, ow.phone, ow.customer_number, o.name
ORDER BY ow.customer_number;

-- === 5. KOLLA TRIGGERS (VIKTIGT!) ===
SELECT 
  trigger_name,
  event_object_table as table_name,
  action_timing,
  event_manipulation as event_type
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%org%'
ORDER BY event_object_table, trigger_name;

-- === 6. KOLLA RLS STATUS ===
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('orgs', 'profiles', 'dogs', 'owners', 'bookings')
ORDER BY tablename;

-- === FÖRVÄNTADE RESULTAT ===
-- Query 1: Du ska se din e-post, org_id, org_name och org_number
-- Query 2: Du ska se din prenumeration (t.ex. "trialing" eller "active")
-- Query 3: Lista över dina hundar (kan vara tom om du inte lagt till någon än)
-- Query 4: Lista över ägare i din organisation
-- Query 5: Triggers som trg_set_org_id_dogs, trg_set_org_id_owners etc.
-- Query 6: rls_enabled = TRUE för alla tabeller

-- === OM NÅGOT SAKNAS ===
-- Om org_id är NULL: Kör fix_missing_org_id.sql (se nedan)
-- Om triggers saknas: Kör RESTORE_TRIGGERS_AND_RLS.sql
-- Om RLS är false: Ditt konto är demo/dev-mode, OK för test
