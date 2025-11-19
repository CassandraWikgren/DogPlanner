-- ============================================================
-- FIX WAITLIST LEGACY DATA
-- ============================================================
-- Problem: Äldre hundar som lagts till har waitlist=NULL istället för false
-- Detta gör att de inte filtreras korrekt i hunddagis-listan
-- 
-- Lösning: Sätt waitlist=false för alla hundar som har ett startdatum
-- (hundar med startdatum är redan antagna, inte bara intresse)
--
-- KÖR I: Supabase SQL Editor
-- ============================================================

BEGIN;

-- 1) Visa vilka hundar som kommer påverkas
SELECT 
  id,
  name,
  waitlist,
  startdate,
  subscription,
  org_id
FROM dogs
WHERE waitlist IS NULL 
  AND startdate IS NOT NULL
ORDER BY name;

-- 2) Uppdatera alla hundar med startdatum till waitlist=false
UPDATE dogs 
SET waitlist = false
WHERE waitlist IS NULL 
  AND startdate IS NOT NULL;

-- 3) Verifiera resultatet
SELECT 
  waitlist,
  COUNT(*) as antal
FROM dogs
GROUP BY waitlist
ORDER BY waitlist;

COMMIT;

-- ============================================================
-- FÖRVÄNTADE RESULTAT:
-- ============================================================
-- Före:
--   waitlist | antal
--   ---------+-------
--   NULL     | många
--   true     | några
--
-- Efter:
--   waitlist | antal
--   ---------+-------
--   false    | många (alla antagna)
--   true     | några (bara intresse)
--
-- ============================================================
