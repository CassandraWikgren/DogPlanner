-- =====================================================
-- DUPLICATE PREVENTION CONSTRAINTS
-- =====================================================
-- Datum: 2025-12-07
-- Syfte: Lägg till unika constraints för att förhindra dubbletter
-- 
-- ⚠️ VARNING: Kör INTE detta förrän du har rensat bort befintliga dubbletter!
-- =====================================================

-- =====================================================
-- STEG 1: Kontrollera befintliga dubbletter FÖRST
-- =====================================================

-- Hitta dubbla owners med samma email inom samma org
SELECT 
  org_id, 
  email, 
  COUNT(*) as antal,
  ARRAY_AGG(id) as duplicate_ids
FROM owners 
WHERE email IS NOT NULL
GROUP BY org_id, email 
HAVING COUNT(*) > 1;

-- Hitta dubbla orgs med samma email
SELECT 
  email, 
  COUNT(*) as antal,
  ARRAY_AGG(id) as duplicate_ids
FROM orgs 
WHERE email IS NOT NULL
GROUP BY email 
HAVING COUNT(*) > 1;

-- Hitta dubbla hundar med samma namn hos samma ägare
SELECT 
  owner_id, 
  name, 
  COUNT(*) as antal,
  ARRAY_AGG(id) as duplicate_ids
FROM dogs 
GROUP BY owner_id, name 
HAVING COUNT(*) > 1;

-- =====================================================
-- STEG 2: RENSA DUBBLETTER (kör manuellt efter granskning)
-- =====================================================

-- Exempel: Ta bort dubbla owners, behåll den äldsta
-- DELETE FROM owners 
-- WHERE id IN (
--   SELECT id FROM (
--     SELECT id, ROW_NUMBER() OVER (
--       PARTITION BY org_id, email 
--       ORDER BY created_at ASC
--     ) as rn
--     FROM owners 
--     WHERE email IS NOT NULL
--   ) sub 
--   WHERE rn > 1
-- );

-- =====================================================
-- STEG 3: LÄGG TILL UNIKA CONSTRAINTS
-- =====================================================

-- 1. Unik constraint på owners.email per org (förhindrar dubbla kunder)
-- OBS: case-insensitive för att undvika "test@test.com" vs "Test@Test.com"
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'owners_email_org_unique'
  ) THEN
    CREATE UNIQUE INDEX owners_email_org_unique 
    ON owners (lower(email), org_id) 
    WHERE email IS NOT NULL;
    RAISE NOTICE '✅ Created: owners_email_org_unique';
  ELSE
    RAISE NOTICE '⏭️ Skipped: owners_email_org_unique already exists';
  END IF;
END $$;

-- 2. Unik constraint på orgs.email (förhindrar dubbla organisationer)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'orgs_email_unique'
  ) THEN
    CREATE UNIQUE INDEX orgs_email_unique 
    ON orgs (lower(email)) 
    WHERE email IS NOT NULL;
    RAISE NOTICE '✅ Created: orgs_email_unique';
  ELSE
    RAISE NOTICE '⏭️ Skipped: orgs_email_unique already exists';
  END IF;
END $$;

-- 3. Unik constraint på dogs per ägare+namn+org (förhindrar dubbla hundar inom samma org)
-- OBS: Samma hund kan registreras hos OLIKA organisationer (hunddagis + pensionat)
-- Men samma ägare kan INTE ha två hundar med samma namn hos SAMMA organisation
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'dogs_owner_name_org_unique'
  ) THEN
    CREATE UNIQUE INDEX dogs_owner_name_org_unique 
    ON dogs (owner_id, lower(name), org_id)
    WHERE org_id IS NOT NULL;
    RAISE NOTICE '✅ Created: dogs_owner_name_org_unique';
  ELSE
    RAISE NOTICE '⏭️ Skipped: dogs_owner_name_org_unique already exists';
  END IF;
END $$;

-- 4. Unik constraint på interest_applications per email+org+hund
-- OBS: Samma person kan ansöka till FLERA organisationer
-- Men kan INTE skicka dubbla ansökningar för SAMMA hund till SAMMA org
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'applications_email_dog_org_unique'
  ) THEN
    CREATE UNIQUE INDEX applications_email_dog_org_unique 
    ON interest_applications (lower(parent_email), org_id, lower(COALESCE(dog_name, '')))
    WHERE status NOT IN ('rejected', 'cancelled');
    RAISE NOTICE '✅ Created: applications_email_dog_org_unique';
  ELSE
    RAISE NOTICE '⏭️ Skipped: applications_email_dog_org_unique already exists';
  END IF;
END $$;

-- =====================================================
-- STEG 4: VERIFIERA
-- =====================================================

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count FROM pg_indexes WHERE indexname LIKE '%_unique';
  RAISE NOTICE '✅ Totalt antal unika index: %', v_count;
END $$;

-- Lista alla unika index
SELECT indexname, tablename, indexdef 
FROM pg_indexes 
WHERE indexname LIKE '%_unique'
ORDER BY tablename;
