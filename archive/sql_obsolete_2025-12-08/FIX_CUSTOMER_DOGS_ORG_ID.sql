-- ============================================================================
-- FIX: Ta bort org_id från hundar som skapats av kunder i kundportalen
-- Datum: 7 december 2025
-- ============================================================================
-- PROBLEMET:
-- Hundar som skapas av kunder i kundportalen ska INTE ha org_id
-- org_id ska endast sättas när pensionatet godkänner en bokning
-- 
-- Felaktigt beteende: Kunden hade org_id i user_metadata, så hunden
-- fick org_id och dök upp på hunddagis-listan
-- ============================================================================

-- STEG 1: DIAGNOSTIK - Visa alla hundar med org_id som tillhör owners med org_id = NULL
-- (Dessa är pensionatkunder vars hundar felaktigt har org_id)
SELECT 
    d.id as dog_id,
    d.name as dog_name,
    d.org_id as dog_org_id,
    o.id as owner_id,
    o.full_name as owner_name,
    o.org_id as owner_org_id,
    org.name as org_name
FROM dogs d
LEFT JOIN owners o ON d.owner_id = o.id
LEFT JOIN orgs org ON d.org_id = org.id
WHERE d.org_id IS NOT NULL 
  AND (o.org_id IS NULL OR o.org_id != d.org_id);

-- STEG 2: FIX - Sätt org_id = NULL för hundar vars ägare inte har samma org_id
-- Detta fixar hundar som skapats av pensionatkunder men felaktigt fått org_id
UPDATE dogs d
SET org_id = NULL
WHERE d.org_id IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM owners o 
    WHERE o.id = d.owner_id 
    AND (o.org_id IS NULL OR o.org_id != d.org_id)
  );

-- STEG 3: VERIFIERA - Kontrollera att fixet fungerade
SELECT 
    d.id,
    d.name,
    d.org_id,
    o.full_name as owner_name,
    o.org_id as owner_org_id
FROM dogs d
LEFT JOIN owners o ON d.owner_id = o.id
WHERE d.owner_id IS NOT NULL
ORDER BY d.created_at DESC
LIMIT 20;

-- ============================================================================
-- NOTERA: Efter denna fix kommer hundar skapade i kundportalen
-- att ha org_id = NULL tills pensionatet godkänner en bokning.
-- Koden i mina-hundar/page.tsx har uppdaterats för att aldrig
-- sätta org_id för nya hundar.
-- ============================================================================
