-- ================================
-- DOGPLANNER - DATABAS VERIFIERING
-- Kör detta för att kontrollera databasstrukturen
-- ================================

-- 1. Kontrollera att alla tabeller finns
SELECT 
  schemaname, 
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN (
    'orgs', 'profiles', 'owners', 'dogs', 'rooms', 
    'bookings', 'extra_service', 'journal', 'interest_applications',
    'invoices', 'pricing', 'branches'
  )
ORDER BY tablename;

-- 2. Kontrollera RLS (Row Level Security) status
SELECT 
  schemaname,
  tablename,
  rowsecurity,
  CASE 
    WHEN rowsecurity THEN '✅ RLS Aktiverad'
    ELSE '❌ RLS Inaktiverad'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'orgs', 'profiles', 'owners', 'dogs', 'rooms', 
    'bookings', 'extra_service', 'journal', 'interest_applications'
  )
ORDER BY tablename;

-- 3. Kontrollera testdata-status
SELECT 
  'orgs' as tabell,
  count(*) as antal_rader,
  CASE WHEN count(*) > 0 THEN '✅ Har data' ELSE '❌ Tom tabell' END as status
FROM orgs
UNION ALL
SELECT 
  'owners' as tabell,
  count(*) as antal_rader,
  CASE WHEN count(*) > 0 THEN '✅ Har data' ELSE '❌ Tom tabell' END as status
FROM owners
UNION ALL
SELECT 
  'dogs' as tabell,
  count(*) as antal_rader,
  CASE WHEN count(*) > 0 THEN '✅ Har data' ELSE '❌ Tom tabell' END as status
FROM dogs
UNION ALL
SELECT 
  'rooms' as tabell,
  count(*) as antal_rader,
  CASE WHEN count(*) > 0 THEN '✅ Har data' ELSE '❌ Tom tabell' END as status
FROM rooms
UNION ALL
SELECT 
  'bookings' as tabell,
  count(*) as antal_rader,
  CASE WHEN count(*) > 0 THEN '✅ Har data' ELSE '❌ Tom tabell' END as status
FROM bookings
UNION ALL
SELECT 
  'interest_applications' as tabell,
  count(*) as antal_rader,
  CASE WHEN count(*) > 0 THEN '✅ Har data' ELSE '❌ Tom tabell' END as status
FROM interest_applications;

-- 4. Kontrollera relationer mellan tabeller
SELECT 
  'Hundar med ägare' as relation,
  count(*) as antal,
  CASE WHEN count(*) > 0 THEN '✅ OK' ELSE '❌ Problem' END as status
FROM dogs d
JOIN owners o ON d.owner_id = o.id

UNION ALL

SELECT 
  'Bokningar med hundar' as relation,
  count(*) as antal,
  CASE WHEN count(*) > 0 THEN '✅ OK' ELSE '❌ Problem' END as status
FROM bookings b
JOIN dogs d ON b.dog_id = d.id

UNION ALL

SELECT 
  'Bokningar med rum' as relation,
  count(*) as antal,
  CASE WHEN count(*) > 0 THEN '✅ OK' ELSE '❌ Problem' END as status
FROM bookings b
JOIN rooms r ON b.room_id = r.id;

-- 5. Kontrollera triggers och policies
SELECT 
  'RLS Policies' as feature,
  count(*) as antal,
  CASE 
    WHEN count(*) >= 20 THEN '✅ Har policies'
    WHEN count(*) > 0 THEN '⚠️ Få policies'
    ELSE '❌ Inga policies'
  END as status
FROM pg_policies 
WHERE schemaname = 'public';

-- 6. Sammanfattning av kritiska data för DogPlanner
SELECT 
  '🏢 Organisationer' as kategori,
  count(*) as antal,
  string_agg(name, ', ') as exempel
FROM orgs
UNION ALL
SELECT 
  '👥 Ägare' as kategori,
  count(*) as antal,
  string_agg(full_name, ', ' ORDER BY full_name LIMIT 3) as exempel
FROM owners
UNION ALL
SELECT 
  '🐕 Hundar' as kategori,
  count(*) as antal,
  string_agg(name, ', ' ORDER BY name LIMIT 5) as exempel
FROM dogs
UNION ALL
SELECT 
  '🏠 Rum' as kategori,
  count(*) as antal,
  string_agg(name, ', ') as exempel
FROM rooms
UNION ALL
SELECT 
  '📅 Bokningar' as kategori,
  count(*) as antal,
  CASE 
    WHEN count(*) > 0 THEN concat(count(*)::text, ' bokningar')
    ELSE 'Inga bokningar'
  END as exempel
FROM bookings;