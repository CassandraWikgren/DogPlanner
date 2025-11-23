-- =====================================================
-- SETUP CUSTOMER NUMBER AUTO-GENERATION
-- Säkerställer att alla ägare får ett unikt kundnummer
-- =====================================================

-- Steg 1: Lägg till kolumnen om den inte finns
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name='owners' AND column_name='customer_number'
  ) THEN
    ALTER TABLE owners ADD COLUMN customer_number INTEGER;
  END IF;
END $$;

-- Steg 2: Skapa sekvens för kundnummer
CREATE SEQUENCE IF NOT EXISTS owners_customer_number_seq START WITH 1;

-- Steg 3: Funktion för att auto-generera kundnummer
CREATE OR REPLACE FUNCTION auto_generate_customer_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.customer_number IS NULL THEN
    NEW.customer_number := nextval('owners_customer_number_seq');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Steg 4: Skapa trigger
DROP TRIGGER IF EXISTS trigger_auto_customer_number ON owners;
CREATE TRIGGER trigger_auto_customer_number
  BEFORE INSERT ON owners
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_customer_number();

-- Steg 5: Uppdatera befintliga ägare utan kundnummer
DO $$
DECLARE
  owner_record RECORD;
  next_num INTEGER;
BEGIN
  -- Hitta högsta befintliga nummer
  SELECT COALESCE(MAX(customer_number), 0) INTO next_num FROM owners;
  
  -- Uppdatera alla som saknar kundnummer
  FOR owner_record IN 
    SELECT id FROM owners WHERE customer_number IS NULL ORDER BY created_at
  LOOP
    next_num := next_num + 1;
    UPDATE owners SET customer_number = next_num WHERE id = owner_record.id;
  END LOOP;
  
  -- Synka sekvensen
  PERFORM setval('owners_customer_number_seq', next_num);
  
  RAISE NOTICE 'Uppdaterade ägare med kundnummer. Högsta nummer: %', next_num;
END $$;

-- Steg 6: Lägg till unikt index
DROP INDEX IF EXISTS owners_customer_number_key;
CREATE UNIQUE INDEX owners_customer_number_key ON owners(customer_number);

-- Steg 7: Kommentarer
COMMENT ON COLUMN owners.customer_number IS 
'Globalt unikt kundnummer som följer hundägaren över alla pensionat/dagis. Auto-genereras vid INSERT.';

-- =====================================================
-- VERIFIERING
-- =====================================================
SELECT 
    COUNT(*) as total_owners,
    COUNT(customer_number) as with_customer_number,
    COUNT(*) - COUNT(customer_number) as without_customer_number,
    MIN(customer_number) as min_number,
    MAX(customer_number) as max_number
FROM owners;
