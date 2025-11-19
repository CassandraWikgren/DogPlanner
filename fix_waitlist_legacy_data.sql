-- ============================================================
-- FIX WAITLIST KOLUMN - LÄGG TILL OCH UPPDATERA DATA
-- ============================================================
-- Problem: 
-- 1. Kolumnen "waitlist" finns inte i dogs-tabellen
-- 2. Koden förväntar sig waitlist för att filtrera väntelista vs antagna hundar
-- 
-- Lösning: 
-- 1. Lägg till waitlist-kolumnen (boolean)
-- 2. Sätt waitlist=false för alla befintliga hundar med startdatum/abonnemang
-- 3. Sätt waitlist=true för hundar utan startdatum/abonnemang (intresseanmälningar)
--
-- KÖR I: Supabase SQL Editor
-- ============================================================

BEGIN;

-- STEG 1: Lägg till waitlist-kolumnen om den inte finns
ALTER TABLE dogs 
ADD COLUMN IF NOT EXISTS waitlist boolean DEFAULT false;

-- STEG 2: Visa nuvarande data INNAN uppdatering
SELECT 
  id,
  name,
  startdate,
  subscription,
  waitlist,
  org_id
FROM dogs
ORDER BY name;

-- STEG 3: Sätt waitlist=false för alla antagna hundar
-- (hundar med startdatum ELLER abonnemang är antagna)
UPDATE dogs 
SET waitlist = false
WHERE (
  startdate IS NOT NULL
  OR subscription IS NOT NULL
);

-- STEG 4: Sätt waitlist=true för hundar som VARKEN har startdatum ELLER abonnemang
-- (dessa är förmodligen intresseanmälningar)
UPDATE dogs 
SET waitlist = true
WHERE startdate IS NULL 
  AND subscription IS NULL;

-- STEG 4: Sätt waitlist=true för hundar som VARKEN har startdatum ELLER abonnemang
-- (dessa är förmodligen intresseanmälningar)
UPDATE dogs 
SET waitlist = true
WHERE startdate IS NULL 
  AND subscription IS NULL;

-- STEG 5: Verifiera resultatet
SELECT 
  waitlist,
  COUNT(*) as antal
FROM dogs
GROUP BY waitlist
ORDER BY waitlist;

-- STEG 6: Visa några exempel på varje kategori
SELECT 
  'ANTAGNA HUNDAR (waitlist=false)' as kategori,
  name,
  startdate,
  subscription,
  waitlist
FROM dogs
WHERE waitlist = false
LIMIT 5;

SELECT 
  'VÄNTELISTA (waitlist=true)' as kategori,
  name,
  startdate,
  subscription,
  waitlist
FROM dogs
WHERE waitlist = true
LIMIT 5;

COMMIT;

-- ============================================================
-- FÖRVÄNTADE RESULTAT:
-- ============================================================
-- waitlist | antal
-- ---------+-------
-- false    | 5     (antagna dagishundar)
-- true     | 12    (intresseanmälningar på väntelista)
--
-- TOTALT: 17 hundar
-- ============================================================
