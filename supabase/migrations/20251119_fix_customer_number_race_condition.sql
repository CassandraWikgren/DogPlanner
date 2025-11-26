-- Migration: Fix customer_number race condition
-- Problem: Original function used SELECT MAX() + 1 which can create duplicates
-- Solution: Ensure SERIAL sequence exists and use nextval()

-- =====================================================
-- 1. Ensure customer_number column exists as SERIAL
-- =====================================================

DO $$
BEGIN
  -- Check if column exists
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='owners' AND column_name='customer_number'
  ) THEN
    -- Add column as SERIAL if it doesn't exist
    ALTER TABLE owners ADD COLUMN customer_number SERIAL UNIQUE;
    RAISE NOTICE 'Added customer_number column as SERIAL';
  ELSE
    -- Column exists, ensure it has a sequence
    DECLARE
      seq_name TEXT;
    BEGIN
      SELECT pg_get_serial_sequence('owners', 'customer_number') INTO seq_name;
      
      IF seq_name IS NULL THEN
        -- No sequence exists, create one and set it as default
        CREATE SEQUENCE IF NOT EXISTS owners_customer_number_seq;
        ALTER TABLE owners ALTER COLUMN customer_number SET DEFAULT nextval('owners_customer_number_seq');
        RAISE NOTICE 'Created sequence owners_customer_number_seq';
      ELSE
        RAISE NOTICE 'Sequence already exists: %', seq_name;
      END IF;
    END;
  END IF;
END $$;

-- =====================================================
-- 2. Update function to use sequence dynamically
-- =====================================================

CREATE OR REPLACE FUNCTION auto_generate_customer_number()
RETURNS TRIGGER AS $$
DECLARE
  seq_name TEXT;
  next_val INTEGER;
BEGIN
  -- Om customer_number inte redan är satt
  IF NEW.customer_number IS NULL THEN
    -- Försök hitta sekvensen
    SELECT pg_get_serial_sequence('owners', 'customer_number') INTO seq_name;
    
    IF seq_name IS NOT NULL THEN
      -- Sequence finns, använd den
      EXECUTE format('SELECT nextval(%L)', seq_name) INTO next_val;
      NEW.customer_number := next_val;
      RAISE NOTICE 'Generated customer_number % using sequence %', next_val, seq_name;
    ELSE
      -- Ingen sequence, använd MAX+1 som fallback
      SELECT COALESCE(MAX(customer_number), 0) + 1 
      INTO NEW.customer_number 
      FROM owners;
      RAISE WARNING 'No sequence found, using MAX+1 fallback: %', NEW.customer_number;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. Sync sequence with existing data
-- =====================================================

DO $$
DECLARE
  max_existing INTEGER;
  seq_name TEXT;
BEGIN
  -- Hitta sequence-namnet
  SELECT pg_get_serial_sequence('owners', 'customer_number') INTO seq_name;
  
  IF seq_name IS NULL THEN
    RAISE WARNING 'Cannot sync sequence - none found';
    RETURN;
  END IF;
  
  -- Hitta högsta befintliga customer_number
  SELECT COALESCE(MAX(customer_number), 0) 
  INTO max_existing 
  FROM owners 
  WHERE customer_number IS NOT NULL;
  
  IF max_existing > 0 THEN
    -- Sätt sequence till max + 1
    EXECUTE format('SELECT setval(%L, %s)', seq_name, max_existing);
    RAISE NOTICE 'Synced sequence % to start from %', seq_name, max_existing + 1;
  ELSE
    RAISE NOTICE 'No existing customer_numbers, sequence will start from 1';
  END IF;
END $$;
