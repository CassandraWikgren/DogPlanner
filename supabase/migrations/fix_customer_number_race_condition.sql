-- Migration: Fix customer_number race condition
-- Problem: Original function used SELECT MAX() + 1 which can create duplicates
-- Solution: Use nextval() on the sequence created by SERIAL

-- =====================================================
-- 1. Update function to use sequence instead of MAX()
-- =====================================================

CREATE OR REPLACE FUNCTION auto_generate_customer_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Om customer_number inte redan är satt, hämta nästa värde från sekvensen
  IF NEW.customer_number IS NULL THEN
    -- SERIAL skapar automatiskt sekvensen owners_customer_number_seq
    -- Vi använder nextval() för att garantera unika värden även vid race conditions
    NEW.customer_number := nextval('owners_customer_number_seq');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 2. Sync sequence with existing max value
-- =====================================================
-- Om det redan finns customer_number värden, sätt sekvensen till rätt startpunkt

DO $$
DECLARE
  max_existing INTEGER;
BEGIN
  -- Hitta högsta befintliga customer_number
  SELECT COALESCE(MAX(customer_number), 0) 
  INTO max_existing 
  FROM owners;
  
  -- Sätt sequence till nästa värde efter högsta befintliga
  IF max_existing > 0 THEN
    PERFORM setval('owners_customer_number_seq', max_existing);
    RAISE NOTICE 'Set sequence to start from %', max_existing + 1;
  END IF;
END $$;
