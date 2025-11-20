-- ============================================================
-- HITTA DIN ORGANISATION ID
-- ============================================================
-- Kör detta i Supabase SQL Editor för att hitta din org_id
-- ============================================================

-- Alternativ 1: Hitta via ditt användarnamn/email
SELECT 
  organisations.id as org_id,
  organisations.name as org_name,
  organisations.org_number,
  profiles.email,
  profiles.full_name
FROM organisations
LEFT JOIN profiles ON profiles.org_id = organisations.id
WHERE profiles.email = 'cassandrawikgren@gmail.com' -- BYT UT MOT DIN EMAIL
   OR profiles.full_name ILIKE '%cassandra%';

-- Alternativ 2: Lista ALLA organisationer (om du har flera)
SELECT 
  id as org_id,
  name as org_name,
  org_number,
  created_at
FROM organisations
ORDER BY created_at DESC;

-- Alternativ 3: Se vilken org som har flest hundar
SELECT 
  dogs.org_id,
  organisations.name as org_name,
  COUNT(dogs.id) as antal_hundar,
  ARRAY_AGG(dogs.name) as hundnamn
FROM dogs
LEFT JOIN organisations ON dogs.org_id = organisations.id
GROUP BY dogs.org_id, organisations.name
ORDER BY antal_hundar DESC;

-- ============================================================
-- När du har hittat din org_id, kopiera den och använd i:
-- fix_waitlist_status.sql
-- ============================================================
