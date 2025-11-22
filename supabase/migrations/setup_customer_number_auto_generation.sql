-- Migration: Setup customer_number auto-generation system
-- För att säkerställa att varje hundägare får ett unikt kundnummer globalt

-- =====================================================
-- 1. Säkerställ att customer_number är SERIAL (auto-increment)
-- =====================================================

-- Om kolumnen inte finns, lägg till den
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='owners' AND column_name='customer_number'
  ) THEN
    ALTER TABLE owners ADD COLUMN customer_number SERIAL;
  END IF;
END $$;

-- =====================================================
-- 2. Skapa funktion för att auto-generera customer_number
-- =====================================================

CREATE OR REPLACE FUNCTION auto_generate_customer_number()
RETURNS TRIGGER AS $$
BEGIN
  -- Om customer_number inte redan är satt, generera automatiskt
  IF NEW.customer_number IS NULL THEN
    -- Hämta nästa värde från sekvensen
    SELECT COALESCE(MAX(customer_number), 0) + 1 
    INTO NEW.customer_number 
    FROM owners;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 3. Skapa trigger för auto-generering
-- =====================================================

-- Ta bort trigger om den redan finns
DROP TRIGGER IF EXISTS trigger_auto_customer_number ON owners;

-- Skapa ny trigger
CREATE TRIGGER trigger_auto_customer_number
  BEFORE INSERT ON owners
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_customer_number();

-- =====================================================
-- 4. Uppdatera befintliga owners utan customer_number
-- =====================================================

-- För alla befintliga ägare utan kundnummer, tilldela ett
DO $$
DECLARE
  next_number INTEGER;
  owner_record RECORD;
  counter INTEGER := 0;
BEGIN
  -- Hitta högsta befintliga customer_number
  SELECT COALESCE(MAX(customer_number), 0) + 1 
  INTO next_number 
  FROM owners 
  WHERE customer_number IS NOT NULL;
  
  -- Uppdatera alla NULL customer_number med sekventiella nummer
  -- Använd en loop istället för window function
  FOR owner_record IN 
    SELECT id FROM owners 
    WHERE customer_number IS NULL 
    ORDER BY created_at
  LOOP
    UPDATE owners 
    SET customer_number = next_number + counter
    WHERE id = owner_record.id;
    
    counter := counter + 1;
  END LOOP;
  
  RAISE NOTICE 'Updated % owners with new customer numbers starting from %', counter, next_number;
END $$;

-- =====================================================
-- 5. Säkerställ att customer_number är unikt
-- =====================================================

-- Skapa unikt index om det inte finns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE indexname = 'owners_customer_number_key'
  ) THEN
    CREATE UNIQUE INDEX owners_customer_number_key ON owners(customer_number);
  END IF;
END $$;

-- =====================================================
-- 6. Kommentar för framtida utvecklare
-- =====================================================

COMMENT ON COLUMN owners.customer_number IS 
'Globalt unikt kundnummer som följer hundägaren över alla pensionat/dagis. Auto-genereras vid INSERT.';

COMMENT ON FUNCTION auto_generate_customer_number() IS 
'Trigger-funktion som auto-genererar ett unikt customer_number för nya owners.';

-- =====================================================
-- VERIFIERING
-- =====================================================

-- Test: Skapa en testägare för att verifiera att customer_number genereras
-- (Kör endast i dev/test, kommentera bort i production)

-- INSERT INTO owners (full_name, email, phone) 
-- VALUES ('Test Ägare', 'test@example.com', '070-1234567')
-- RETURNING id, customer_number;

-- Förväntad output: customer_number ska vara automatiskt satt

