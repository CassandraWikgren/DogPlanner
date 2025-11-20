-- ============================================================
-- FIXA VÄNTELISTA-STATUS FÖR ALLA ORGANISATIONER
-- ============================================================
-- Automatisk fix för alla organisationer
-- Regler:
-- 1. Hundar MED startdatum OCH abonnemang = GODKÄNDA (waitlist=false)
-- 2. Hundar UTAN startdatum ELLER utan abonnemang = VÄNTELISTA (waitlist=true)
-- 
-- KÖR I: Supabase SQL Editor
-- ============================================================

BEGIN;

-- STEG 1: Se nuvarande status för ALLA organisationer
SELECT 
  dogs.org_id,
  organisations.name as org_name,
  COUNT(*) as totalt_hundar,
  COUNT(CASE WHEN dogs.waitlist = true THEN 1 END) as pa_vantelista,
  COUNT(CASE WHEN dogs.waitlist = false THEN 1 END) as godkanda,
  COUNT(CASE WHEN dogs.waitlist IS NULL THEN 1 END) as ej_satta
FROM dogs
LEFT JOIN organisations ON dogs.org_id = organisations.id
GROUP BY dogs.org_id, organisations.name
ORDER BY organisations.name;

-- STEG 2: AUTOMATISK FIX - Sätt godkända hundar (har startdatum OCH aktiva)
-- Regel: Om hund har startdatum OCH is_active=true → Godkänd
UPDATE dogs
SET waitlist = false
WHERE is_active = true 
  AND startdate IS NOT NULL
  AND (waitlist IS NULL OR waitlist = true);

-- STEG 3: AUTOMATISK FIX - Sätt väntelista-hundar (saknar startdatum ELLER ej aktiva)
-- Regel: Om hund saknar startdatum ELLER is_active=false → Väntelista
UPDATE dogs
SET waitlist = true
WHERE (startdate IS NULL OR is_active = false)
  AND (waitlist IS NULL OR waitlist = false);

COMMIT;

-- ============================================================
-- STEG 4: VERIFIERA ÄNDRINGARNA FÖR ALLA ORGANISATIONER
-- ============================================================
SELECT 
  organisations.name as organisation,
  CASE 
    WHEN dogs.waitlist = true THEN '🟠 VÄNTELISTA'
    ELSE '✅ GODKÄND'
  END as status,
  dogs.name,
  dogs.breed,
  dogs.startdate,
  dogs.subscription,
  dogs.is_active,
  owners.full_name as agare
FROM dogs
LEFT JOIN owners ON dogs.owner_id = owners.id
LEFT JOIN organisations ON dogs.org_id = organisations.id
ORDER BY organisations.name, dogs.waitlist DESC, dogs.name;

-- ============================================================
-- SAMMANFATTNING AV ÄNDRINGAR
-- ============================================================
SELECT 
  organisations.name as organisation,
  COUNT(*) as totalt,
  COUNT(CASE WHEN dogs.waitlist = true THEN 1 END) as vantelista,
  COUNT(CASE WHEN dogs.waitlist = false THEN 1 END) as godkanda
FROM dogs
LEFT JOIN organisations ON dogs.org_id = organisations.id
GROUP BY organisations.name
ORDER BY organisations.name;

-- ============================================================
-- MANUELLA JUSTERINGAR (OM BEHÖVS)
-- ============================================================
-- Om du vill manuellt ändra specifika hundar:

/*
-- Flytta specifik hund till väntelista
UPDATE dogs SET waitlist = true WHERE name = 'HundNamn' AND org_id = 'org-id';

-- Flytta specifik hund till godkända
UPDATE dogs SET waitlist = false WHERE name = 'HundNamn' AND org_id = 'org-id';

-- Se alla hundar för en specifik organisation
SELECT name, breed, waitlist, startdate, subscription
FROM dogs
WHERE org_id = 'org-id'
ORDER BY waitlist DESC, name;
*/
