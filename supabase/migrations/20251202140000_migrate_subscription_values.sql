-- Migration: Uppdatera gamla subscription-värden till nya format
-- Datum: 2025-12-02
-- Beskrivning: Konvertera "Heltid", "Deltid 2", "Deltid 3" till nya dynamiska format

-- =====================================================
-- 1. Uppdatera dogs-tabellen
-- =====================================================

UPDATE dogs
SET subscription = '5 dagar/vecka'
WHERE LOWER(subscription) = 'heltid';

UPDATE dogs
SET subscription = '3 dagar/vecka'
WHERE LOWER(subscription) IN ('deltid 3', 'deltid_3');

UPDATE dogs
SET subscription = '2 dagar/vecka'
WHERE LOWER(subscription) IN ('deltid 2', 'deltid_2');

-- Dagshund behåller samma namn
-- NULL-värden behåller NULL

-- =====================================================
-- 2. Uppdatera interest_applications-tabellen
-- =====================================================

UPDATE interest_applications
SET subscription_type = '5 dagar/vecka'
WHERE LOWER(subscription_type) = 'heltid';

UPDATE interest_applications
SET subscription_type = '3 dagar/vecka'
WHERE LOWER(subscription_type) IN ('deltid 3', 'deltid_3');

UPDATE interest_applications
SET subscription_type = '2 dagar/vecka'
WHERE LOWER(subscription_type) IN ('deltid 2', 'deltid_2');

-- Dagshund behåller samma namn

-- =====================================================
-- 3. Bekräfta ändringarna
-- =====================================================

DO $$
DECLARE
  dogs_count INT;
  interest_count INT;
BEGIN
  -- Räkna uppdaterade hundar
  SELECT COUNT(*) INTO dogs_count
  FROM dogs
  WHERE subscription IN ('2 dagar/vecka', '3 dagar/vecka', '5 dagar/vecka', 'Dagshund');
  
  -- Räkna uppdaterade intresseanmälningar
  SELECT COUNT(*) INTO interest_count
  FROM interest_applications
  WHERE subscription_type IN ('2 dagar/vecka', '3 dagar/vecka', '5 dagar/vecka', 'Dagshund');
  
  RAISE NOTICE '✅ Subscription-värden uppdaterade:';
  RAISE NOTICE '   - Dogs: % rader med nya värden', dogs_count;
  RAISE NOTICE '   - Interest applications: % rader med nya värden', interest_count;
END $$;
