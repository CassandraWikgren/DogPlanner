-- ============================================================
-- FIXA VÄNTELISTA-STATUS FÖR BEFINTLIGA HUNDAR
-- ============================================================
-- Detta script hjälper dig att sätta rätt waitlist-status
-- på hundar som redan finns i systemet
-- 
-- KÖR I: Supabase SQL Editor
-- ============================================================

-- STEG 1: Se alla hundar och deras nuvarande waitlist-status
SELECT 
  id,
  name,
  breed,
  waitlist,
  subscription,
  startdate,
  owners.full_name as owner_name
FROM dogs
LEFT JOIN owners ON dogs.owner_id = owners.id
WHERE org_id = 'DIN-ORG-ID-HÄR' -- Byt ut mot din organisation ID
ORDER BY name;

-- ============================================================
-- STEG 2: SÄTT WAITLIST=TRUE FÖR SPECIFIKA HUNDAR
-- ============================================================
-- Kopiera och ändra detta för varje hund som SKA vara på väntelistan

/*
-- Exempel: Sätt Bella på väntelistan
UPDATE dogs
SET waitlist = true
WHERE name = 'Bella' 
  AND org_id = 'DIN-ORG-ID-HÄR';

-- Exempel: Sätt flera hundar på väntelistan samtidigt
UPDATE dogs
SET waitlist = true
WHERE name IN ('Bella', 'Bonnie', 'Klark')
  AND org_id = 'DIN-ORG-ID-HÄR';
*/

-- ============================================================
-- STEG 3: SÄTT WAITLIST=FALSE FÖR GODKÄNDA HUNDAR
-- ============================================================
-- Om några hundar felaktigt är markerade som väntelista

/*
-- Ta bort från väntelistan (sätt till godkänd)
UPDATE dogs
SET waitlist = false
WHERE name = 'Joy'
  AND org_id = 'DIN-ORG-ID-HÄR';
*/

-- ============================================================
-- STEG 4: VERIFIERA ÄNDRINGARNA
-- ============================================================
-- Kör detta för att se uppdateringarna

SELECT 
  CASE 
    WHEN waitlist = true THEN '🟠 VÄNTELISTA'
    ELSE '✅ GODKÄND'
  END as status,
  name,
  breed,
  owners.full_name as owner_name,
  subscription
FROM dogs
LEFT JOIN owners ON dogs.owner_id = owners.id
WHERE org_id = 'DIN-ORG-ID-HÄR'
ORDER BY waitlist DESC, name;

-- ============================================================
-- SNABBKOMMANDO: Sätt ALLA hundar som GODKÄNDA (ej väntelista)
-- ============================================================
-- OBS: Använd bara detta om du vill nollställa alla

/*
UPDATE dogs
SET waitlist = false
WHERE org_id = 'DIN-ORG-ID-HÄR'
  AND waitlist IS NULL;
*/

-- ============================================================
-- AUTOMATISK REGEL: Hundar utan startdatum = väntelista?
-- ============================================================
-- Detta sätter automatiskt waitlist=true för hundar utan startdatum

/*
UPDATE dogs
SET waitlist = true
WHERE org_id = 'DIN-ORG-ID-HÄR'
  AND startdate IS NULL
  AND waitlist IS NULL;
*/

-- ============================================================
-- DEBUG: Kolla om det finns duplicerade hundar
-- ============================================================
SELECT 
  name,
  breed,
  COUNT(*) as antal_kopior,
  ARRAY_AGG(id) as dog_ids
FROM dogs
WHERE org_id = 'DIN-ORG-ID-HÄR'
GROUP BY name, breed
HAVING COUNT(*) > 1
ORDER BY antal_kopior DESC;
