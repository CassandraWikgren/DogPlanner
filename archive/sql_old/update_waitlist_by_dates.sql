-- ============================================================
-- AUTOMATISK WAITLIST-UPPDATERING BASERAT PÅ DATUM
-- ============================================================
-- Uppdaterar dogs.waitlist baserat på start- och slutdatum:
-- - VÄNTELISTA (true): Inget startdatum ELLER framtida startdatum ELLER passerat slutdatum
-- - ANTAGEN (false): Startdatum passerat OCH (inget slutdatum ELLER slutdatum ej passerat)
-- ============================================================

BEGIN;

-- ============================================================
-- LOGIK: SÄTT WAITLIST BASERAT PÅ DATUM
-- ============================================================

-- 1. ANTAGNA: Startdatum passerat OCH (inget slutdatum ELLER slutdatum i framtiden)
UPDATE dogs
SET waitlist = false
WHERE startdate IS NOT NULL
  AND startdate <= CURRENT_DATE
  AND (enddate IS NULL OR enddate >= CURRENT_DATE);

-- 2. VÄNTELISTA: Inget startdatum ELLER framtida startdatum
UPDATE dogs
SET waitlist = true
WHERE startdate IS NULL
   OR startdate > CURRENT_DATE;

-- 3. AVSLUTADE → VÄNTELISTA: Slutdatum passerat
UPDATE dogs
SET waitlist = true
WHERE enddate IS NOT NULL
  AND enddate < CURRENT_DATE;

COMMIT;

-- ============================================================
-- VERIFIERING
-- ============================================================

-- Visa resultat per organisation
SELECT 
  orgs.name as "Organisation",
  COUNT(*) FILTER (WHERE dogs.waitlist = false) as "🟢 Antagna (aktiva)",
  COUNT(*) FILTER (WHERE dogs.waitlist = true AND dogs.startdate IS NULL) as "⏳ Väntelista (ingen startdatum)",
  COUNT(*) FILTER (WHERE dogs.waitlist = true AND dogs.startdate > CURRENT_DATE) as "📅 Väntelista (framtida start)",
  COUNT(*) FILTER (WHERE dogs.waitlist = true AND dogs.enddate < CURRENT_DATE) as "🔴 Avslutade",
  COUNT(*) as "📊 Totalt"
FROM dogs
LEFT JOIN orgs ON dogs.org_id = orgs.id
GROUP BY orgs.name
ORDER BY orgs.name;

-- Visa exempel på varje kategori
SELECT 
  '🟢 ANTAGNA (AKTIVA)' as kategori,
  name as hundnamn,
  startdate,
  enddate,
  waitlist
FROM dogs
WHERE waitlist = false
  AND startdate <= CURRENT_DATE
  AND (enddate IS NULL OR enddate >= CURRENT_DATE)
LIMIT 5;

SELECT 
  '⏳ VÄNTELISTA (INGEN START)' as kategori,
  name as hundnamn,
  startdate,
  enddate,
  waitlist
FROM dogs
WHERE waitlist = true
  AND startdate IS NULL
LIMIT 5;

SELECT 
  '📅 VÄNTELISTA (FRAMTIDA)' as kategori,
  name as hundnamn,
  startdate,
  enddate,
  waitlist
FROM dogs
WHERE waitlist = true
  AND startdate > CURRENT_DATE
LIMIT 5;

SELECT 
  '🔴 AVSLUTADE' as kategori,
  name as hundnamn,
  startdate,
  enddate,
  waitlist
FROM dogs
WHERE waitlist = true
  AND enddate < CURRENT_DATE
LIMIT 5;
