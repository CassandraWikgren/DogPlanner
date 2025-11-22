-- Migration: Fix customer_number race condition
-- Problem: Original function used SELECT MAX() + 1 which can create duplicates
-- Solution: Use nextval() on the sequence created by SERIAL

-- =====================================================
-- 1. Find the actual sequence name created by SERIAL
-- =====================================================

DO $$
DECLARE
  seq_name TEXT;
BEGIN
  -- SERIAL creates a sequence with pattern: tablename_columnname_seq
  -- We need to find it dynamically in case it has a different name
  SELECT pg_get_serial_sequence('owners', 'customer_number') INTO seq_name;
  
  IF seq_name IS NULL THEN
    RAISE EXCEPTION 'No sequence found for owners.customer_number. Ensure column is SERIAL type.';
  END IF;
  
  RAISE NOTICE 'Found sequence: %', seq_name;
END $$;

-- =====================================================
-- 2. Update function to use the SERIAL default behavior
-- =====================================================
-- Simply let SERIAL do its job - it already uses nextval() automatically

CREATE OR REPLACE FUNCTION auto_generate_customer_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_name TEXT;
BEGIN
  -- Om customer_number inte redan är satt, använd sekvensen
  IF NEW.customer_number IS NULL THEN
    -- Hämta sequence-namnet dynamiskt
    SELECT pg_get_serial_sequence('owners', 'customer_number') INTO seq_name;
    
    IF seq_name IS NOT NULL THEN
      EXECUTE format('SELECT nextval(%L)', seq_name) INTO NEW.customer_number;
    ELSE
      -- Fallback till MAX+1 om ingen sequence finns (borde inte hända)
      SELECT COALESCE(MAX(customer_number), 0) + 1 
      INTO NEW.customer_number 
      FROM owners;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. Sync sequence with existing max value
-- =====================================================

DO $$
DECLARE
  max_existing INTEGER;
  seq_name TEXT;
BEGIN
  -- Hitta sequence-namnet
  SELECT pg_get_serial_sequence('owners', 'customer_number') INTO seq_name;
  
  IF seq_name IS NULL THEN
    RAISE WARNING 'No sequence found for owners.customer_number';
    RETURN;
  END IF;
  
  -- Hitta högsta befintliga customer_number
  SELECT COALESCE(MAX(customer_number), 0) 
  INTO max_existing 
  FROM owners;
  
  -- Sätt sequence till nästa värde efter högsta befintliga
  IF max_existing > 0 THEN
    EXECUTE format('SELECT setval(%L, %s)', seq_name, max_existing);
    RAISE NOTICE 'Set sequence % to start from %', seq_name, max_existing + 1;
  END IF;
END $$;
